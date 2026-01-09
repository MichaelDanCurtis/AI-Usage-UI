import { MonitoringConfig, ConfigUpdateRequest } from '../types/index.js';

export class MonitoringConfigManager {
  private config: MonitoringConfig;

  constructor(initialApis: string[], initialEnabled: boolean = true) {
    this.config = {
      enabled: initialEnabled,
      monitoredApis: [...initialApis],
      lastUpdated: new Date().toISOString(),
    };
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getMonitoredApis(): string[] {
    return [...this.config.monitoredApis];
  }

  isApiMonitored(apiName: string): boolean {
    return this.config.monitoredApis.includes(apiName);
  }

  updateConfig(request: ConfigUpdateRequest): MonitoringConfig {
    if (request.enabled !== undefined) {
      this.config.enabled = request.enabled;
    }

    if (request.addApis && request.addApis.length > 0) {
      for (const api of request.addApis) {
        if (api && !this.config.monitoredApis.includes(api)) {
          this.config.monitoredApis.push(api);
        }
      }
    }

    if (request.removeApis && request.removeApis.length > 0) {
      this.config.monitoredApis = this.config.monitoredApis.filter(
        api => !request.removeApis!.includes(api)
      );
    }

    this.config.lastUpdated = new Date().toISOString();
    return this.getConfig();
  }

  setEnabled(enabled: boolean): MonitoringConfig {
    this.config.enabled = enabled;
    this.config.lastUpdated = new Date().toISOString();
    return this.getConfig();
  }

  addApi(apiName: string): MonitoringConfig {
    if (apiName && !this.config.monitoredApis.includes(apiName)) {
      this.config.monitoredApis.push(apiName);
      this.config.lastUpdated = new Date().toISOString();
    }
    return this.getConfig();
  }

  removeApi(apiName: string): MonitoringConfig {
    this.config.monitoredApis = this.config.monitoredApis.filter(api => api !== apiName);
    this.config.lastUpdated = new Date().toISOString();
    return this.getConfig();
  }

  setMonitoredApis(apis: string[]): MonitoringConfig {
    this.config.monitoredApis = [...apis];
    this.config.lastUpdated = new Date().toISOString();
    return this.getConfig();
  }
}
