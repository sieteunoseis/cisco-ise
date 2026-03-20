const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const xmlParser = new XMLParser({ ignoreAttributes: false });

class IseClient {
  constructor(conn, opts = {}) {
    this.conn = conn;
    this.noCache = opts.noCache || false;
    this.debug = opts.debug || false;
    this.dryRun = opts.dryRun || false;
    this.configDir = process.env.CISCO_ISE_CONFIG_DIR || path.join(require("os").homedir(), ".cisco-ise");
    this.cacheDir = path.join(this.configDir, "cache");
    this.cacheTTL = 5 * 60 * 1000;

    this.axios = axios.create({
      auth: { username: conn.username, password: conn.password },
      httpsAgent: conn.insecure
        ? new (require("https").Agent)({ rejectUnauthorized: false })
        : undefined,
      timeout: 90000,
    });
  }

  ersUrl(endpoint) {
    const host = this.conn.ppan || this.conn.host;
    return `https://${host}:9060/ers/config${endpoint}`;
  }

  openApiUrl(endpoint) {
    const host = this.conn.ppan || this.conn.host;
    return `https://${host}/api/v1${endpoint}`;
  }

  mntUrl(endpoint) {
    const host = this.conn.pmnt || this.conn.host;
    return `https://${host}/admin/API/mnt${endpoint}`;
  }

  cacheKey(url, params = {}) {
    const data = JSON.stringify({ url, params });
    return crypto.createHash("md5").update(data).digest("hex");
  }

  getCached(key) {
    if (this.noCache) return null;
    const file = path.join(this.cacheDir, `${key}.json`);
    try {
      const stat = fs.statSync(file);
      if (Date.now() - stat.mtimeMs > this.cacheTTL) {
        fs.unlinkSync(file);
        return null;
      }
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return null;
    }
  }

  setCache(key, data) {
    if (this.noCache) return;
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.writeFileSync(path.join(this.cacheDir, `${key}.json`), JSON.stringify(data));
  }

  invalidateCache(prefix) {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (!prefix || file.startsWith(prefix)) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
    } catch { /* cache dir may not exist */ }
  }

  async ersGet(endpoint, params = {}) {
    const url = this.ersUrl(endpoint);
    const key = this.cacheKey(url, params);
    const cached = this.getCached(key);
    if (cached) return cached;

    const res = await this.request("GET", url, {
      headers: { Accept: "application/json" },
      params,
    });
    this.setCache(key, res.data);
    return res.data;
  }

  async ersPaginateAll(endpoint, params = {}, opts = {}) {
    const limit = opts.limit || Infinity;
    const pageSize = opts.pageSize || 100;
    let page = opts.page || 1;
    let all = [];

    while (all.length < limit) {
      const data = await this.ersGet(endpoint, { ...params, size: pageSize, page });
      const result = data?.SearchResult;
      if (!result?.resources?.length) break;
      all = all.concat(result.resources);
      if (all.length >= result.total || result.resources.length < pageSize) break;
      page++;
    }

    const results = all.slice(0, limit === Infinity ? undefined : limit);
    // Strip ERS link objects (they render as [object Object] in table output)
    return results.map((r) => {
      if (!r.link) return r;
      const { link, ...rest } = r;
      return rest;
    });
  }

  async ersPost(endpoint, body) {
    const url = this.ersUrl(endpoint);
    if (this.dryRun) {
      return { dryRun: true, method: "POST", url, body };
    }
    const res = await this.request("POST", url, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: body,
    });
    this.invalidateCache();
    return res.data;
  }

  async ersPut(endpoint, body) {
    const url = this.ersUrl(endpoint);
    if (this.dryRun) {
      return { dryRun: true, method: "PUT", url, body };
    }
    const res = await this.request("PUT", url, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: body,
    });
    this.invalidateCache();
    return res.data;
  }

  async ersDelete(endpoint) {
    const url = this.ersUrl(endpoint);
    if (this.dryRun) {
      return { dryRun: true, method: "DELETE", url };
    }
    const res = await this.request("DELETE", url, {
      headers: { Accept: "application/json" },
    });
    this.invalidateCache();
    return res.data;
  }

  async openApiGet(endpoint, params = {}) {
    const url = this.openApiUrl(endpoint);
    const key = this.cacheKey(url, params);
    const cached = this.getCached(key);
    if (cached) return cached;

    const res = await this.request("GET", url, {
      headers: { Accept: "application/json" },
      params,
    });
    this.setCache(key, res.data);
    return res.data;
  }

  async mntGet(endpoint) {
    const url = this.mntUrl(endpoint);
    const key = this.cacheKey(url);
    const cached = this.getCached(key);
    if (cached) return cached;

    const res = await this.request("GET", url, {
      headers: { Accept: "application/xml" },
    });
    const parsed = xmlParser.parse(res.data);
    this.setCache(key, parsed);
    return parsed;
  }

  async request(method, url, config = {}) {
    if (this.debug) {
      process.stderr.write(`[DEBUG] ${method} ${url}\n`);
    }
    try {
      return await this.axios({ method, url, ...config });
    } catch (err) {
      if (err.response?.status === 429) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          const delay = Math.pow(2, attempt) * 1000;
          process.stderr.write(`Rate limited, retrying in ${delay / 1000}s...\n`);
          await new Promise((r) => setTimeout(r, delay));
          try {
            return await this.axios({ method, url, ...config });
          } catch (retryErr) {
            if (retryErr.response?.status !== 429 || attempt === 3) throw retryErr;
          }
        }
      }
      throw err;
    }
  }
}

module.exports = IseClient;
