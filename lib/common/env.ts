import "dotenv/config";

class ENV {
  static DATABASE_URL = this.getEnv("DATABASE_URL");
  static JWT_SECRET = this.getEnv("JWT_SECRET");


  static getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
      throw new Error(`Required environment variable "${key}" is missing.`);
    }
    return value;
  }
}

export default ENV;