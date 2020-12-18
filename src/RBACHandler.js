"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.RBACHandler = void 0;
/*
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 */
var jsonwebtoken_1 = require("jsonwebtoken");
var fhir_works_on_aws_interface_1 = require("fhir-works-on-aws-interface");
var isEqual_1 = require("lodash/isEqual");
// eslint-disable-next-line import/prefer-default-export
var RBACHandler = /** @class */ (function () {
    function RBACHandler(rules, fhirVersion) {
        this.version = 1.0;
        this.rules = rules;
        if (this.rules.version !== this.version) {
            throw Error('Configuration version does not match handler version');
        }
        this.fhirVersion = fhirVersion;
    }
    RBACHandler.prototype.verifyAccessToken = function (request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var decoded, groups;
            return __generator(this, function (_c) {
                decoded = (_a = jsonwebtoken_1.decode(request.accessToken, { json: true })) !== null && _a !== void 0 ? _a : {};
                groups = (_b = decoded['cognito:groups']) !== null && _b !== void 0 ? _b : [];
                if (request.bulkDataAuth) {
                    this.isBulkDataAccessAllowed(groups, request.bulkDataAuth);
                    return [2 /*return*/, decoded];
                }
                this.isAllowed(groups, request.operation, request.resourceType);
                return [2 /*return*/, decoded];
            });
        });
    };
    // eslint-disable-next-line class-methods-use-this
    RBACHandler.prototype.isAccessBulkDataJobAllowed = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (request.userIdentity.sub !== request.jobOwnerId) {
                    throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
                }
                return [2 /*return*/];
            });
        });
    };
    RBACHandler.prototype.isBundleRequestAuthorized = function (request) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var groups, authZPromises;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        groups = (_a = request.userIdentity['cognito:groups']) !== null && _a !== void 0 ? _a : [];
                        authZPromises = request.requests.map(function (batch) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, this.isAllowed(groups, batch.operation, batch.resourceType)];
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(authZPromises)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RBACHandler.prototype.getAllowedResourceTypesForOperation = function (request) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var userIdentity, operation, groups;
            var _this = this;
            return __generator(this, function (_b) {
                userIdentity = request.userIdentity, operation = request.operation;
                groups = (_a = userIdentity['cognito:groups']) !== null && _a !== void 0 ? _a : [];
                return [2 /*return*/, groups.flatMap(function (group) {
                        var groupRule = _this.rules.groupRules[group];
                        if (groupRule !== undefined && groupRule.operations.includes(operation)) {
                            return groupRule.resources;
                        }
                        return [];
                    })];
            });
        });
    };
    // eslint-disable-next-line class-methods-use-this
    RBACHandler.prototype.authorizeAndFilterReadResponse = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Currently no additional filtering/checking is needed for RBAC
                return [2 /*return*/, request.readResponse];
            });
        });
    };
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    RBACHandler.prototype.isWriteRequestAuthorized = function (_request) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    RBACHandler.prototype.isAllowed = function (groups, operation, resourceType) {
        for (var index = 0; index < groups.length; index += 1) {
            var group = groups[index];
            if (this.rules.groupRules[group]) {
                var rule = this.rules.groupRules[group];
                if (rule.operations.includes(operation) &&
                    ((resourceType && rule.resources.includes(resourceType)) || !resourceType)) {
                    return;
                }
            }
        }
        throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
    };
    RBACHandler.prototype.isBulkDataAccessAllowed = function (groups, bulkDataAuth) {
        var operation = bulkDataAuth.operation, exportType = bulkDataAuth.exportType;
        if (['get-status-export', 'cancel-export', 'get-status-import', 'cancel-import'].includes(operation)) {
            return;
        }
        if (operation === 'initiate-export') {
            var _loop_1 = function (index) {
                var group = groups[index];
                if (this_1.rules.groupRules[group]) {
                    var rule_1 = this_1.rules.groupRules[group];
                    if (exportType && rule_1.operations.includes('read')) {
                        if (exportType === 'system') {
                            // TODO: Enable supporting of different profiles by specifying the resources you would want to export
                            // in BASE_R4_RESOURCES
                            if ((this_1.fhirVersion === '4.0.1' &&
                                isEqual_1["default"](rule_1.resources.sort(), fhir_works_on_aws_interface_1.BASE_R4_RESOURCES.sort())) ||
                                (this_1.fhirVersion === '3.0.1' &&
                                    isEqual_1["default"](rule_1.resources.sort(), fhir_works_on_aws_interface_1.BASE_STU3_RESOURCES.sort()))) {
                                return { value: void 0 };
                            }
                        }
                        if (exportType === 'group' || exportType === 'patient') {
                            var matchEveryResource = false;
                            if (this_1.fhirVersion === '4.0.1') {
                                matchEveryResource = fhir_works_on_aws_interface_1.R4_PATIENT_COMPARTMENT_RESOURCES.every(function (resource) {
                                    return rule_1.resources.includes(resource);
                                });
                            }
                            else if (this_1.fhirVersion === '3.0.1') {
                                matchEveryResource = fhir_works_on_aws_interface_1.STU3_PATIENT_COMPARTMENT_RESOURCES.every(function (resource) {
                                    return rule_1.resources.includes(resource);
                                });
                            }
                            if (matchEveryResource) {
                                return { value: void 0 };
                            }
                            throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
                        }
                    }
                }
            };
            var this_1 = this;
            for (var index = 0; index < groups.length; index += 1) {
                var state_1 = _loop_1(index);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }
        else if (operation === 'initiate-import') {
            // TODO Handle `initiate-import` auth
        }
        throw new fhir_works_on_aws_interface_1.UnauthorizedError('Unauthorized');
    };
    return RBACHandler;
}());
exports.RBACHandler = RBACHandler;
