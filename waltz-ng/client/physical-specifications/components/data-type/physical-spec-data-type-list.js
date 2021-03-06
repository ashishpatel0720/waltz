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

import {initialiseData} from "../../../common";
import {CORE_API} from "../../../common/services/core-api-utils";

import template from "./physical-spec-data-type-list.html";


const bindings = {
    parentEntityRef: '<'
};


const initialState = {
    dataTypes: []
};


function controller(serviceBroker) {
    const vm = initialiseData(this, initialState);

    vm.$onChanges = () => {
        const selectorOptions = {
            entityReference: vm.parentEntityRef,
            scope: 'EXACT'
        };

        serviceBroker
            .loadViewData(CORE_API.PhysicalSpecDataTypeStore.findBySpecificationSelector, [selectorOptions])
            .then(result => vm.dataTypes = result.data);
    };
}


controller.$inject = [
    'ServiceBroker'
];


export default {
    component: {
        template,
        bindings,
        controller
    },
    id: 'waltzPhysicalSpecDataTypeList'
};

