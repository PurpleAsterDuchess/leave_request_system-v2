import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { IsDateString, IsIn, IsNotEmpty } from "class-validator";

@Entity({ name: "leaveRequest" })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  leaveId: number;

  @ManyToOne(() => User, { nullable: false })
  @IsNotEmpty({ message: "User is required" })
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
    enum: ["pending", "approved", "rejected", "canceled"],
    default: "pending",
  })
  @IsIn(["pending", "approved", "rejected", "canceled"], {
    message: "Invalid status",
  })
  status: "pending" | "approved" | "rejected" | "canceled";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: "enum",
    enum: ["Annual Leave"],
    default: "Annual Leave",
  })
  @IsIn(["Annual Leave"], { message: "Invalid leave type" })
  type: "Annual Leave";
}
