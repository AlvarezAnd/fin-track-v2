import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tokens_refresco_revocaciones')
export class RefreshTokenRevocation {
  @PrimaryColumn({ name: 'family_id', type: 'varchar', length: 64 })
  familyId: string;

  @Column({ name: 'revoked_at', type: 'timestamptz' })
  revokedAt: Date;
}
