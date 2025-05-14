import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { IsDateString } from "class-validator";

@Entity({ name: "leaveRequest" })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  leaveId: number;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: "date" })
  @IsDateString({}, { message: "Invalid start date" })
  startDate: string;

  @Column({ type: "date" })
  @IsDateString({}, { message: "Invalid start date" })
  endDate: string;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status: "pending" | "approved" | "rejected"|"canceled";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: "enum",
    enum: ["Annual Leave"],
    default: "Annual Leave",
  })
  type: "Annual Leave";
}
