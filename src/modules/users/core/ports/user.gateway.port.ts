// Gateway interface - Contrato público para otros slices
export interface IUserGateway {
  getUserEmail(userId: string): Promise<string>;
}

export const USER_GATEWAY = Symbol('USER_GATEWAY');
