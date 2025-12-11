declare module '@prisma/client' {
  class PrismaClient {
    constructor(...args: any[]);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $on(eventType: string, callback: (...args: any[]) => void): void;
    [key: string]: any;
  }

  export { PrismaClient };
}
