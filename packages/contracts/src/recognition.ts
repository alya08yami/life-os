/** Transport only. No provider credentials belong in this package or the client. */
export type RecognitionRequest = {requestId:string; operation:'classify_text'|'recognize_movie'; inputVersion:number; text?:string; image?:{base64:string;mime:'image/jpeg'|'image/png'|'image/webp'}; locale:'ru'|'uk'|'en'};
export type MovieCandidate = {title:string;year?:number;evidence?:string;needsReview:true};
export type RecognitionResult = {requestId:string;source:'ai';candidate:MovieCandidate;usage:{inputTokens:number;outputTokens:number;costMicroUsd:number};cached:boolean};
export type RecognitionFailure = {code:'unauthorized'|'quota_exceeded'|'provider_unavailable'|'invalid_input'|'recognition_failed';requestId:string;manualFallback:true};
export const capabilities = {localOrganizer:true,aiRecognition:false,incomingShare:false,cloudSync:false,notifications:false} as const;

/** Runtime API contract; availability is obtained from /api/health, never inferred from these types. */
export type ProcessingRequest={requestId:string;text:string;image?:{base64:string;mime:string};locale:'ru'|'uk'|'en'};
export type ProcessingResponse={candidate:import('../../domain/src/index.ts').ItemInput;inputTokens:number;outputTokens:number;costMicroUsd:number;cached:boolean;needsReview:true};
export type RuntimeCapabilities={ai:boolean;catalog:boolean;sharedSpaces:boolean;notifications:boolean;cloudSync:boolean};
export type PlanEntitlements={aiRequestsPerDay:number;sharedSpaces:number};
export const planEntitlements:Record<'free'|'premium'|'family',PlanEntitlements>={free:{aiRequestsPerDay:10,sharedSpaces:3},premium:{aiRequestsPerDay:100,sharedSpaces:20},family:{aiRequestsPerDay:200,sharedSpaces:50}};
