import type { Prisma } from "@/generated/prisma/client";

export type TaskAttachment = {
  id: string;
  mimeType: string;
  data: string;
  createdAt: string;
  taskId: string;
  activityId: string | null;
};

export type TaskActivity = {
  id: string;
  type: string;
  message: string;
  createdAt: string | Date;
};

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    project: { include: { area: true } };
    area: true;
    tags: true;
    subtasks: true;
    isNextActionFor: true;
    activities: {
      where: { type: "NOTE_ADDED" };
      select: { id: true };
    };
  };
}>;

export type TaskDetail = Omit<TaskWithRelations, "activities" | "subtasks"> & {
  activities: TaskActivity[];
  attachments: TaskAttachment[];
  subtasks: (TaskWithRelations["subtasks"][number] & {
    attachments: TaskAttachment[];
  })[];
};

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    area: true;
    tags: true;
    nextActionTask: true;
    tasks: true;
  };
}>;

export type AreaWithCounts = Prisma.AreaGetPayload<{
  include: {
    projects: true;
    tasks: true;
  };
}>;

export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: {
    task: true;
    project: true;
  };
}>;
