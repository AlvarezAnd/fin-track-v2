import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('tokens_refresco')
export class RefreshToken {
  /** SHA-256 of the opaque refresh token. */
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index('tokens_refresco_family_id_idx')
  @Column({ name: 'family_id', type: 'varchar', length: 64 })
  familyId: string;

  @Index('tokens_refresco_user_id_idx')
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Index('tokens_refresco_family_expires_at_idx')
  @Column({ name: 'family_expires_at', type: 'timestamptz' })
  familyExpiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  claims: Record<string, unknown> | null;
}
