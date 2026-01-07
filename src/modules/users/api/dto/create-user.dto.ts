export class CreateUserDto {
  email!: string;
  name!: string;
  tenantId!: string;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  tenantId!: string;
  isSuperAdmin!: boolean;
  createdAt!: string;
  updatedAt!: string;
}
