import { Injectable } from '@nestjs/common';
import { IUserGateway } from '../../core/ports/user.gateway.port';

@Injectable()
export class UserGatewayGrpcAdapter implements IUserGateway {
  // Este adaptador usaría @grpc/grpc-js para llamar al microservicio de Users
  // TODO: Implementar cuando se migre a microservicios

  async getUserEmail(_userId: string): Promise<string> {
    throw new Error(
      'gRPC adapter not implemented yet - use local adapter for monolithic deployment',
    );
  }
}
