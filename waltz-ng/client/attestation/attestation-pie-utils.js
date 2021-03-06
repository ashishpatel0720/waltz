/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017, 2018, 2019 Waltz open source project
 * See README.md for more information
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific
 *
 */

import { attestationStatusColorScale } from "../common/colors";
import _ from "lodash";
import { toKeyCounts } from "../common";
import { keys } from "d3-collection";
import { mapToDisplayNames } from "../applications/application-utils";
import { mkDateGridCell, mkEntityLinkGridCell } from "../common/grid-utils";

const attestationStatus = {
    ATTESTED: {
        key: "ATTESTED",
        name: "Attested",
        description: "This flow has been attested",
        position: 10
    },
    NEVER_ATTESTED: {
        key: "NEVER_ATTESTED",
        name: "Never Attested",
        icon: null,
        description: "This flow has never been attested",
        position: 20
    }
};


export const attestationPieConfig = {
    colorProvider: (d) => attestationStatusColorScale(d.key),
    size: 40,
    labelProvider: (d) => attestationStatus[d.key] ? attestationStatus[d.key].name : "Unknown"
};

/**
 * Returns grid data with application, latest attestation, attested status
 * @param applications: all applications subjected for aggregation
 * @param attestationInstances: all attestationInstances for the applications
 * @param attestedEntityKind: Entity Kind against which attestation data needs to be collected
 * **/
export function mkAppAttestationGridData(applications = [],
                                         attestationInstances = [],
                                         attestedEntityKind,
                                         displayNameService) {

    const attestationByAppId = _.groupBy(
        _.filter(attestationInstances,
                inst => inst.attestedEntityKind === attestedEntityKind),
        "parentEntity.id");

    return _.map(applications, app => ({
        application: Object.assign({}, app, mapToDisplayNames(displayNameService, app)),
        isAttested: (_.includes(keys(attestationByAppId), String(app.id)) ? "ATTESTED" : "NEVER_ATTESTED"),
        attestation: _.maxBy(attestationByAppId[app.id], "attestedAt")
    }
    ));
}

export function prepareSummaryData(applications = []) {
    return toKeyCounts(applications, a => a.isAttested);
}


export const attestationSummaryColumnDefs = [
    mkEntityLinkGridCell("Name", "application", "left", "right"),
    {field: "application.assetCode", name: "Asset Code"},
    {field: "application.kindDisplay", name: "Kind"},
    {field: "businessCriticalityDisplay", name: "Business Criticality"},
    {field: "application.lifecyclePhaseDisplay", name: "Lifecycle Phase"},
    {field: "attestation.attestedBy", name: "Last Attested By"},
    mkDateGridCell("Last Attested at", "attestation.attestedAt")
];


