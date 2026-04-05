declare module "midtrans-client" {
  export class Snap {
    transaction: any;
    constructor(options: {
      isProduction: boolean;
      serverKey: string | undefined;
      clientKey: string | undefined;
    });
    createTransaction(parameter: any): Promise<{
      token: string;
      redirect_url: string;
    }>;
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string | undefined;
      clientKey: string | undefined;
    });
    transaction: {
      notification(notificationJson: any): Promise<any>;
    };
  }
}
