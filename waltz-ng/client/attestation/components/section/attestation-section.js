/*
 * Waltz - Enterprise Architecture
 * Copyright (C) 2016, 2017 Waltz open source project
 * See README.md for more information
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {initialiseData} from "../../../common/index";
import {CORE_API} from "../../../common/services/core-api-utils";
import _ from "lodash";
import template from "./attestation-section.html";

const initialState = {
    attestations: [],
    enableAttest: false,
    createType: null,
};

const bindings = {
    parentEntityRef: "<"
};


function mkAttestationData(attestationRuns = [], attestationInstances = []){
    const runsById = _.keyBy(attestationRuns, "id");

    return _.map(attestationInstances, instance => ({
        "instance": instance,
        "run": runsById[instance.attestationRunId]
    }));
}


function controller($q,
                    serviceBroker,
                    notification) {

    const vm = initialiseData(this, initialState);

    const loadData = () => {

        const runsPromise = serviceBroker
            .loadViewData(CORE_API.AttestationRunStore.findByEntityRef, [vm.parentEntityRef], { force: true })
            .then(r => r.data);

        const instancesPromise = serviceBroker
            .loadViewData(CORE_API.AttestationInstanceStore.findByEntityRef, [vm.parentEntityRef], { force: true })
            .then(r => r.data);

        return $q.all([runsPromise, instancesPromise])
            .then(([runs, instances]) => {
                vm.attestations = mkAttestationData(runs, instances);

                vm.entityAttestations = (vm.attestations != null) ?  _.filter(vm.attestations,
                    function(entityAttestation)
                    { return entityAttestation.run.name === "Entity Attestation"
                        && entityAttestation.instance.attestedAt == null})
                    : null;
            });
    };

    vm.$onInit = () => {
        loadData();
    };

    vm.$onChanges = () => {
        if (vm.parentEntityRef) {
            loadData();
        }
    };

    vm.enableAttestToggle = () => vm.enableAttest = !vm.enableAttest;

    vm.setCreateType = (type) => vm.createType = type;

    vm.attestEntity = () => {
        if (confirm("By clicking confirm, you are attesting that all data flows are present and correct for this entity, and thereby accountable for this validation.")){
            serviceBroker
                .execute(
                    CORE_API.AttestationRunStore.create, [mkCreateCommand(vm.parentEntityRef, vm.createType)])
                .then(r => {
                    return loadData();
                })
                .then(() => {
                    vm.entityAttestationInstance = (vm.attestations != null) ?  _.find(vm.attestations,
                        function(entityAttestation)
                        { return entityAttestation.run.name === "Entity Attestation"
                            && entityAttestation.instance.attestedAt == null
                            && entityAttestation.run.attestedEntityKind === vm.createType })
                        : null;
                    serviceBroker
                        .execute(CORE_API.AttestationInstanceStore.attestInstance, [vm.entityAttestationInstance.instance.id])
                        .then(exec => vm.entityAttestationInstance = null, () => notification.error("Failed to attest flows"))
                        .then(() => {
                            notification.success("Attested successfully");
                            vm.enableAttestToggle();
                            return loadData();
                        })
                })
                .then(r => vm.setCreateType(null));
        }
    };

    vm.cancelAttestation = () => {
        vm.enableAttestToggle();
        vm.setCreateType(null);
    }
}


function mkCreateCommand(parentEntityRef, entityKind){

    const now = new Date(Date.now());
    const sixMonthsAhead = new Date(now.getFullYear() , now.getMonth() + 6, now.getDate()).toISOString();

    return {
        name: "Entity Attestation",
        description: "Attests that all flows are present and correct for this entity",
        selectionOptions: {
            entityReference: parentEntityRef,
            scope: "EXACT"
        },
        targetEntityKind: "APPLICATION",
        attestedEntityKind: entityKind,
        attestedEntityId: null,
        involvementKindIds: null,
        dueDate: sixMonthsAhead
    };
}


controller.$inject = [
    "$q",
    "ServiceBroker",
    "Notification"
];


const component = {
    bindings,
    template,
    controller
};


export default {
    component,
    id: "waltzAttestationSection",
    controllerAs: "$ctrl"
};


