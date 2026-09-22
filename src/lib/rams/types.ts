export type RoadClass = "expressway" | "primary" | "secondary" | "urban-arterial" | "collector";
export type SurfaceType = "asphalt" | "concrete" | "gravel" | "cobblestone";
export type Severity = "critical" | "high" | "medium" | "low";
export type ConditionCategory = "Excellent" | "Good" | "Fair" | "Poor" | "Critical";
export type Priority = "critical" | "high" | "medium" | "low";
export type DefectType =
  | "pothole"
  | "cracking"
  | "rutting"
  | "drainage"
  | "erosion"
  | "bleeding"
  | "edge-break"
  | "raveling";
export type AssetType = "bridge" | "culvert" | "sign" | "drainage" | "lighting" | "guardrail" | "km-post";
export type WorkStatus = "draft" | "planned" | "assigned" | "in-progress" | "completed" | "cancelled";
export type ActivityStatus = "planned" | "in progress" | "completed" | "cancelled";
export type Treatment =
  | "routine"
  | "preventive"
  | "overlay"
  | "rehabilitation"
  | "reconstruction";
export type DetectedBy = "manual" | "ai" | "survey";

export type LatLng = [number, number];

/** Survey GPS fixed at a known chainage (km from corridor start). */
export type ChainageGps = {
  chainageKm: number;
  position: LatLng;
};

export type Road = {
  id: string;
  code: string;
  name: string;
  roadClass: RoadClass;
  surface: SurfaceType;
  start: string;
  end: string;
  lengthKm: number;
  path: LatLng[];
  chainageGps?: ChainageGps[];
  status: "active" | "under-construction" | "closed";
  lanes: number;
  yearOpened: number;
  aadt: number;
};

export type Section = {
  id: string;
  roadId: string;
  code: string;
  startChainage: number;
  endChainage: number;
  surface: SurfaceType;
  inspectionRating: number | null;
  lastInspected: string | null;
  iri: number | null;
  path: LatLng[];
  chainageGps?: ChainageGps[];
};

export type Asset = {
  id: string;
  roadId: string;
  sectionId: string | null;
  type: AssetType;
  code: string;
  chainageKm: number;
  condition: number;
  description: string;
  position: LatLng;
};

export type Inspection = {
  id: string;
  sectionId: string;
  date: string;
  inspector: string;
  rating: number;
  weather: string;
  notes: string;
};

export type Defect = {
  id: string;
  sectionId: string;
  inspectionId: string | null;
  type: DefectType;
  severity: Severity;
  chainageKm: number;
  lengthM: number;
  widthM: number;
  depthMm: number;
  description: string;
  detectedBy: DetectedBy;
  date: string;
  position: LatLng;
  status: "open" | "programmed" | "repaired";
  photos?: string[];
};

export type MaintenanceActivity = {
  id: string;
  roadId: string;
  sectionId: string | null;
  defectId: string | null;
  planId: string | null;
  activityType: string;
  treatment: Treatment;
  priority: Priority;
  chainageKm: number | null;
  plannedDate: string;
  completedDate: string | null;
  estimatedCost: number;
  actualCost: number | null;
  contractor: string;
  status: ActivityStatus;
  description: string;
};

export type WorkOrder = {
  id: string;
  code: string;
  title: string;
  roadId: string;
  sectionId: string | null;
  activityId: string | null;
  defectId?: string | null;
  status: WorkStatus;
  priority: Priority;
  assignee: string;
  opened: string;
  due: string;
  closed: string | null;
  estimatedCost: number;
  notes: string;
};

export type MaintenancePlan = {
  id: string;
  year: number;
  ethiopianYear: number;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: "draft" | "approved" | "in progress" | "completed";
  description: string;
};

export type ConditionAssessment = {
  score: number;
  category: ConditionCategory;
  priority: Priority;
  recommendation: string;
  treatment: Treatment;
  defectImpact: number;
  defectCount: number;
};
