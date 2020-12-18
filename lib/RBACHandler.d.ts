import { Authorization, AuthorizationBundleRequest, AllowedResourceTypesForOperationRequest, ReadResponseAuthorizedRequest, VerifyAccessTokenRequest, WriteRequestAuthorizedRequest, FhirVersion, AccessBulkDataJobRequest, KeyValueMap } from 'fhir-works-on-aws-interface';
import { RBACConfig } from './RBACConfig';
export declare class RBACHandler implements Authorization {
    private readonly version;
    private readonly rules;
    private readonly fhirVersion;
    constructor(rules: RBACConfig, fhirVersion: FhirVersion);
    verifyAccessToken(request: VerifyAccessTokenRequest): Promise<KeyValueMap>;
    isAccessBulkDataJobAllowed(request: AccessBulkDataJobRequest): Promise<void>;
    isBundleRequestAuthorized(request: AuthorizationBundleRequest): Promise<void>;
    getAllowedResourceTypesForOperation(request: AllowedResourceTypesForOperationRequest): Promise<string[]>;
    authorizeAndFilterReadResponse(request: ReadResponseAuthorizedRequest): Promise<any>;
    isWriteRequestAuthorized(_request: WriteRequestAuthorizedRequest): Promise<void>;
    private isAllowed;
    private isBulkDataAccessAllowed;
}
