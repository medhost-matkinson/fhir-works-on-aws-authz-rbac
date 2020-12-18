"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACHandler = void 0;
/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
const jsonwebtoken_1 = require("jsonwebtoken");
const fhir_works_on_aws_interface_1 = require("fhir-works-on-aws-interface");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
// eslint-disable-next-line import/prefer-default-export
class RBACHandler {
    constructor(rules, fhirVersion) {
        this.version = 1.0;
        this.rules = rules;
        if (this.rules.version !== this.version) {
            throw Error('Configuration version does not match handler version');
        }
        this.fhirVersion = fhirVersion;
    }
    async verifyAccessToken(request) {
        var _a, _b;
        const decoded = (_a = jsonwebtoken_1.decode(request.accessToken, { json: true })) !== null && _a !== void 0 ? _a : {};
        const groups = (_b = decoded['cognito:groups']) !== null && _b !== void 0 ? _b : [];
        if (request.bulkDataAuth) {
            this.isBulkDataAccessAllowed(groups, request.bulkDataAuth);
            return decoded;
        }
        this.isAllowed(groups, request.operation, request.resourceType);
        return decoded;
    }
    // eslint-disable-next-line class-methods-use-this
    async isAccessBulkDataJobAllowed(request) {
        if (request.userIdentity.sub !== request.jobOwnerId) {
            throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
        }
    }
    async isBundleRequestAuthorized(request) {
        var _a;
        const groups = (_a = request.userIdentity['cognito:groups']) !== null && _a !== void 0 ? _a : [];
        const authZPromises = request.requests.map(async (batch) => {
            return this.isAllowed(groups, batch.operation, batch.resourceType);
        });
        await Promise.all(authZPromises);
    }
    async getAllowedResourceTypesForOperation(request) {
        var _a;
        const { userIdentity, operation } = request;
        const groups = (_a = userIdentity['cognito:groups']) !== null && _a !== void 0 ? _a : [];
        return groups.flatMap(group => {
            const groupRule = this.rules.groupRules[group];
            if (groupRule !== undefined && groupRule.operations.includes(operation)) {
                return groupRule.resources;
            }
            return [];
        });
    }
    // eslint-disable-next-line class-methods-use-this
    async authorizeAndFilterReadResponse(request) {
        // Currently no additional filtering/checking is needed for RBAC
        return request.readResponse;
    }
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    async isWriteRequestAuthorized(_request) { }
    isAllowed(groups, operation, resourceType) {
        for (let index = 0; index < groups.length; index += 1) {
            const group = groups[index];
            if (this.rules.groupRules[group]) {
                const rule = this.rules.groupRules[group];
                if (rule.operations.includes(operation) &&
                    ((resourceType && rule.resources.includes(resourceType)) || !resourceType)) {
                    return;
                }
            }
        }
        throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
    }
    isBulkDataAccessAllowed(groups, bulkDataAuth) {
        const { operation, exportType } = bulkDataAuth;
        if (['get-status-export', 'cancel-export', 'get-status-import', 'cancel-import'].includes(operation)) {
            return;
        }
        if (operation === 'initiate-export') {
            for (let index = 0; index < groups.length; index += 1) {
                const group = groups[index];
                if (this.rules.groupRules[group]) {
                    const rule = this.rules.groupRules[group];
                    if (exportType && rule.operations.includes('read')) {
                        if (exportType === 'system') {
                            // TODO: Enable supporting of different profiles by specifying the resources you would want to export
                            // in BASE_R4_RESOURCES
                            if ((this.fhirVersion === '4.0.1' &&
                                isEqual_1.default(rule.resources.sort(), fhir_works_on_aws_interface_1.BASE_R4_RESOURCES.sort())) ||
                                (this.fhirVersion === '3.0.1' &&
                                    isEqual_1.default(rule.resources.sort(), fhir_works_on_aws_interface_1.BASE_STU3_RESOURCES.sort()))) {
                                return;
                            }
                        }
                        if (exportType === 'group' || exportType === 'patient') {
                            let matchEveryResource = false;
                            if (this.fhirVersion === '4.0.1') {
                                matchEveryResource = fhir_works_on_aws_interface_1.R4_PATIENT_COMPARTMENT_RESOURCES.every((resource) => {
                                    return rule.resources.includes(resource);
                                });
                            }
                            else if (this.fhirVersion === '3.0.1') {
                                matchEveryResource = fhir_works_on_aws_interface_1.STU3_PATIENT_COMPARTMENT_RESOURCES.every((resource) => {
                                    return rule.resources.includes(resource);
                                });
                            }
                            if (matchEveryResource) {
                                return;
                            }
                            throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
                        }
                    }
                }
            }
        }
        else if (operation === 'initiate-import') {
            // TODO Handle `initiate-import` auth
        }
        throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
    }
}
exports.RBACHandler = RBACHandler;
//# sourceMappingURL=RBACHandler.js.map