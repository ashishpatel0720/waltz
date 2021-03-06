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

package com.khartec.waltz.data.perspective_definition;

import com.khartec.waltz.common.SetUtilities;
import com.khartec.waltz.model.perspective.ImmutablePerspectiveDefinition;
import com.khartec.waltz.model.perspective.PerspectiveDefinition;
import com.khartec.waltz.schema.tables.records.PerspectiveDefinitionRecord;
import org.jooq.DSLContext;
import org.jooq.RecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.khartec.waltz.common.Checks.checkNotNull;
import static com.khartec.waltz.common.StringUtilities.mkSafe;
import static com.khartec.waltz.schema.tables.PerspectiveDefinition.PERSPECTIVE_DEFINITION;

@Repository
public class PerspectiveDefinitionDao {

    private static final RecordMapper<PerspectiveDefinitionRecord, PerspectiveDefinition> TO_DOMAIN_MAPPER = r -> {


        return ImmutablePerspectiveDefinition.builder()
                .id(r.getId())
                .ratingSchemeId(r.getRatingSchemeId())
                .name(r.getName())
                .description(r.getDescription())
                .categoryX(r.getCategoryX())
                .categoryY(r.getCategoryY())
                .build();
    };


    private final DSLContext dsl;


    @Autowired
    public PerspectiveDefinitionDao(DSLContext dsl) {
        checkNotNull(dsl, "dsl cannot be null");
        this.dsl = dsl;
    }


    public List<PerspectiveDefinition> findAll() {
        return dsl.selectFrom(PERSPECTIVE_DEFINITION)
                .orderBy(PERSPECTIVE_DEFINITION.NAME.asc())
                .fetch(TO_DOMAIN_MAPPER);
    }

    public boolean create(PerspectiveDefinition perspectiveDefinition) {

        Set<Set<Long>> existing = dsl
                .select(PERSPECTIVE_DEFINITION.CATEGORY_X, PERSPECTIVE_DEFINITION.CATEGORY_Y)
                .from(PERSPECTIVE_DEFINITION)
                .fetch()
                .stream()
                .map(pd -> SetUtilities.fromArray(pd.value1(), pd.value2()))
                .collect(Collectors.toSet());

        Set<Long> proposed = SetUtilities.fromArray(
                perspectiveDefinition.categoryX(),
                perspectiveDefinition.categoryY());

        if (existing.contains(proposed)) {
            return false;
        } else {
            PerspectiveDefinitionRecord record = dsl.newRecord(PERSPECTIVE_DEFINITION);
            record.setName(perspectiveDefinition.name());
            record.setCategoryX(perspectiveDefinition.categoryX());
            record.setCategoryY(perspectiveDefinition.categoryY());
            record.setDescription(mkSafe(perspectiveDefinition.description()));

            return record.insert() == 1;
        }
    }
}
