/*
 * Copyright 2020 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package br.com.zup.darwin.circle.matcher.api.request;

import br.com.zup.darwin.circle.matcher.domain.Node;
import br.com.zup.darwin.circle.matcher.domain.Segmentation;
import br.com.zup.darwin.circle.matcher.domain.SegmentationType;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

public abstract class SegmentationRequest {

    @NotBlank
    private String name;

    @Valid
    private Node node;

    @NotBlank
    private String reference;

    @NotBlank
    private String circleId;

    @NotNull
    private SegmentationType type;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Node getNode() {
        return node;
    }

    public void setNode(Node node) {
        this.node = node;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getCircleId() {
        return circleId;
    }

    public void setCircleId(String circleId) {
        this.circleId = circleId;
    }

    public SegmentationType getType() {
        return type;
    }

    public void setType(SegmentationType type) {
        this.type = type;
    }

    public Segmentation toSegmentation() {
        return new Segmentation(this.name, this.node, this.reference, this.circleId, this.type);
    }

}