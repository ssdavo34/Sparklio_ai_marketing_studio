"""
Document Conversion Service

Polotno, LayerHub, Konva 간 문서 변환

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from typing import Dict, Any, List
import json
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)


class ConversionService:
    """문서 변환 서비스"""

    async def convert(
        self,
        source_format: str,
        target_format: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """문서 형식 변환"""
        try:
            # 같은 형식이면 그대로 반환
            if source_format == target_format:
                return data

            # 먼저 Sparklio 형식으로 정규화
            sparklio_doc = await self._to_sparklio(source_format, data)

            # Sparklio에서 대상 형식으로 변환
            result = await self._from_sparklio(target_format, sparklio_doc)

            logger.info(f"문서 변환 완료: {source_format} -> {target_format}")
            return result

        except Exception as e:
            logger.error(f"문서 변환 실패: {str(e)}")
            raise ValueError(f"변환 실패: {str(e)}")

    async def _to_sparklio(
        self,
        source_format: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """각 형식을 Sparklio 형식으로 변환"""

        if source_format == "sparklio":
            return data
        elif source_format == "polotno":
            return self._polotno_to_sparklio(data)
        elif source_format == "layerhub":
            return self._layerhub_to_sparklio(data)
        elif source_format == "konva":
            return self._konva_to_sparklio(data)
        else:
            raise ValueError(f"지원하지 않는 형식: {source_format}")

    async def _from_sparklio(
        self,
        target_format: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Sparklio 형식에서 각 형식으로 변환"""

        if target_format == "sparklio":
            return data
        elif target_format == "polotno":
            return self._sparklio_to_polotno(data)
        elif target_format == "layerhub":
            return self._sparklio_to_layerhub(data)
        elif target_format == "konva":
            return self._sparklio_to_konva(data)
        else:
            raise ValueError(f"지원하지 않는 형식: {target_format}")

    # ============================================================================
    # Polotno 변환
    # ============================================================================

    def _polotno_to_sparklio(self, polotno_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Polotno -> Sparklio 변환"""
        sparklio_pages = []

        for page in polotno_doc.get("pages", []):
            sparklio_elements = []

            for child in page.get("children", []):
                element = self._polotno_element_to_sparklio(child)
                if element:
                    sparklio_elements.append(element)

            sparklio_page = {
                "id": page.get("id", str(uuid4())),
                "name": page.get("name", "Page"),
                "elements": sparklio_elements,
                "width": page.get("width", 1920),
                "height": page.get("height", 1080),
                "backgroundColor": page.get("background", "#FFFFFF")
            }
            sparklio_pages.append(sparklio_page)

        return {
            "title": polotno_doc.get("name", "Untitled"),
            "kind": "concept_board",  # 기본값
            "pages": sparklio_pages,
            "metadata": {
                "original_format": "polotno",
                "version": polotno_doc.get("version", "1.0")
            }
        }

    def _polotno_element_to_sparklio(self, element: Dict[str, Any]) -> Dict[str, Any]:
        """Polotno 요소 -> Sparklio 요소 변환"""
        element_type = element.get("type", "")

        # 타입 매핑
        type_map = {
            "text": "text",
            "image": "image",
            "svg": "shape",
            "line": "shape",
            "figure": "shape",
            "group": "group"
        }

        sparklio_type = type_map.get(element_type, "shape")

        # 속성 변환
        props = {
            "fill": element.get("fill"),
            "stroke": element.get("stroke"),
            "strokeWidth": element.get("strokeWidth"),
            "opacity": element.get("opacity", 1),
            "visible": element.get("visible", True),
            "locked": element.get("locked", False)
        }

        # 텍스트 속성
        if sparklio_type == "text":
            props.update({
                "text": element.get("text", ""),
                "fontSize": element.get("fontSize"),
                "fontFamily": element.get("fontFamily"),
                "fontWeight": element.get("fontWeight"),
                "fontStyle": element.get("fontStyle"),
                "textAlign": element.get("align"),
                "color": element.get("fill")
            })

        # 이미지 속성
        elif sparklio_type == "image":
            props["src"] = element.get("src", "")

        return {
            "id": element.get("id", str(uuid4())),
            "type": sparklio_type,
            "x": element.get("x", 0),
            "y": element.get("y", 0),
            "width": element.get("width", 100),
            "height": element.get("height", 100),
            "rotation": element.get("rotation", 0),
            "scaleX": element.get("scaleX", 1),
            "scaleY": element.get("scaleY", 1),
            "props": props
        }

    def _sparklio_to_polotno(self, sparklio_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio -> Polotno 변환"""
        polotno_pages = []

        for page in sparklio_doc.get("pages", []):
            polotno_children = []

            for element in page.get("elements", []):
                polotno_element = self._sparklio_element_to_polotno(element)
                if polotno_element:
                    polotno_children.append(polotno_element)

            polotno_page = {
                "id": page.get("id"),
                "name": page.get("name", "Page"),
                "children": polotno_children,
                "width": page.get("width", 1920),
                "height": page.get("height", 1080),
                "background": page.get("backgroundColor", "#FFFFFF")
            }
            polotno_pages.append(polotno_page)

        return {
            "name": sparklio_doc.get("title", "Untitled"),
            "pages": polotno_pages,
            "version": "1.0"
        }

    def _sparklio_element_to_polotno(self, element: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio 요소 -> Polotno 요소 변환"""
        element_type = element.get("type", "")
        props = element.get("props", {})

        # 기본 속성
        polotno_element = {
            "id": element.get("id"),
            "type": element_type,
            "x": element.get("x", 0),
            "y": element.get("y", 0),
            "width": element.get("width", 100),
            "height": element.get("height", 100),
            "rotation": element.get("rotation", 0),
            "scaleX": element.get("scaleX", 1),
            "scaleY": element.get("scaleY", 1),
            "fill": props.get("fill"),
            "stroke": props.get("stroke"),
            "strokeWidth": props.get("strokeWidth"),
            "opacity": props.get("opacity", 1),
            "visible": props.get("visible", True),
            "locked": props.get("locked", False)
        }

        # 텍스트 속성
        if element_type == "text":
            polotno_element.update({
                "text": props.get("text", ""),
                "fontSize": props.get("fontSize"),
                "fontFamily": props.get("fontFamily"),
                "fontWeight": props.get("fontWeight"),
                "fontStyle": props.get("fontStyle"),
                "align": props.get("textAlign")
            })

        # 이미지 속성
        elif element_type == "image":
            polotno_element["src"] = props.get("src", "")

        return polotno_element

    # ============================================================================
    # LayerHub 변환
    # ============================================================================

    def _layerhub_to_sparklio(self, layerhub_doc: Dict[str, Any]) -> Dict[str, Any]:
        """LayerHub -> Sparklio 변환"""
        sparklio_elements = []

        for layer in layerhub_doc.get("layers", []):
            element = self._layerhub_layer_to_sparklio(layer)
            if element:
                sparklio_elements.append(element)

        # LayerHub는 단일 페이지 형식
        sparklio_page = {
            "id": str(uuid4()),
            "name": "Page 1",
            "elements": sparklio_elements,
            "width": layerhub_doc.get("frame", {}).get("width", 1920),
            "height": layerhub_doc.get("frame", {}).get("height", 1080),
            "backgroundColor": layerhub_doc.get("background", {}).get("value", "#FFFFFF")
        }

        return {
            "title": layerhub_doc.get("name", "Untitled"),
            "kind": "concept_board",
            "pages": [sparklio_page],
            "metadata": {
                "original_format": "layerhub",
                "version": layerhub_doc.get("version", "1.0")
            }
        }

    def _layerhub_layer_to_sparklio(self, layer: Dict[str, Any]) -> Dict[str, Any]:
        """LayerHub 레이어 -> Sparklio 요소 변환"""
        layer_type = layer.get("type", "")

        # 타입 매핑
        type_map = {
            "StaticText": "text",
            "StaticImage": "image",
            "StaticPath": "shape",
            "StaticVector": "shape",
            "Group": "group"
        }

        sparklio_type = type_map.get(layer_type, "shape")

        # 속성 변환
        props = {
            "fill": layer.get("fill"),
            "stroke": layer.get("stroke"),
            "strokeWidth": layer.get("strokeWidth"),
            "opacity": layer.get("opacity", 1),
            "visible": layer.get("visible", True),
            "locked": layer.get("locked", False)
        }

        # 텍스트 속성
        if sparklio_type == "text":
            props.update({
                "text": layer.get("text", ""),
                "fontSize": layer.get("fontSize"),
                "fontFamily": layer.get("fontFamily"),
                "fontWeight": layer.get("fontWeight"),
                "textAlign": layer.get("textAlign"),
                "color": layer.get("fill")
            })

        # 이미지 속성
        elif sparklio_type == "image":
            props["src"] = layer.get("src", "")

        return {
            "id": layer.get("id", str(uuid4())),
            "type": sparklio_type,
            "x": layer.get("left", 0),
            "y": layer.get("top", 0),
            "width": layer.get("width", 100),
            "height": layer.get("height", 100),
            "rotation": layer.get("angle", 0),
            "scaleX": layer.get("scaleX", 1),
            "scaleY": layer.get("scaleY", 1),
            "props": props
        }

    def _sparklio_to_layerhub(self, sparklio_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio -> LayerHub 변환"""
        # LayerHub는 단일 페이지만 지원
        first_page = sparklio_doc.get("pages", [{}])[0]

        layers = []
        for element in first_page.get("elements", []):
            layer = self._sparklio_element_to_layerhub(element)
            if layer:
                layers.append(layer)

        return {
            "name": sparklio_doc.get("title", "Untitled"),
            "frame": {
                "width": first_page.get("width", 1920),
                "height": first_page.get("height", 1080)
            },
            "background": {
                "type": "color",
                "value": first_page.get("backgroundColor", "#FFFFFF")
            },
            "layers": layers,
            "version": "1.0"
        }

    def _sparklio_element_to_layerhub(self, element: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio 요소 -> LayerHub 레이어 변환"""
        element_type = element.get("type", "")
        props = element.get("props", {})

        # 타입 매핑
        type_map = {
            "text": "StaticText",
            "image": "StaticImage",
            "shape": "StaticPath",
            "group": "Group"
        }

        layerhub_type = type_map.get(element_type, "StaticPath")

        # 기본 속성
        layer = {
            "id": element.get("id"),
            "type": layerhub_type,
            "left": element.get("x", 0),
            "top": element.get("y", 0),
            "width": element.get("width", 100),
            "height": element.get("height", 100),
            "angle": element.get("rotation", 0),
            "scaleX": element.get("scaleX", 1),
            "scaleY": element.get("scaleY", 1),
            "fill": props.get("fill"),
            "stroke": props.get("stroke"),
            "strokeWidth": props.get("strokeWidth"),
            "opacity": props.get("opacity", 1),
            "visible": props.get("visible", True),
            "locked": props.get("locked", False)
        }

        # 텍스트 속성
        if element_type == "text":
            layer.update({
                "text": props.get("text", ""),
                "fontSize": props.get("fontSize"),
                "fontFamily": props.get("fontFamily"),
                "fontWeight": props.get("fontWeight"),
                "textAlign": props.get("textAlign")
            })

        # 이미지 속성
        elif element_type == "image":
            layer["src"] = props.get("src", "")

        return layer

    # ============================================================================
    # Konva 변환
    # ============================================================================

    def _konva_to_sparklio(self, konva_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Konva -> Sparklio 변환"""
        sparklio_elements = []

        # Konva는 Stage -> Layer -> Children 구조
        for layer in konva_doc.get("children", []):
            if layer.get("className") == "Layer":
                for child in layer.get("children", []):
                    element = self._konva_node_to_sparklio(child)
                    if element:
                        sparklio_elements.append(element)

        sparklio_page = {
            "id": str(uuid4()),
            "name": "Page 1",
            "elements": sparklio_elements,
            "width": konva_doc.get("attrs", {}).get("width", 1920),
            "height": konva_doc.get("attrs", {}).get("height", 1080),
            "backgroundColor": "#FFFFFF"
        }

        return {
            "title": "Untitled",
            "kind": "concept_board",
            "pages": [sparklio_page],
            "metadata": {
                "original_format": "konva"
            }
        }

    def _konva_node_to_sparklio(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Konva 노드 -> Sparklio 요소 변환"""
        class_name = node.get("className", "")
        attrs = node.get("attrs", {})

        # 타입 매핑
        type_map = {
            "Text": "text",
            "Image": "image",
            "Rect": "shape",
            "Circle": "shape",
            "Line": "shape",
            "Path": "shape",
            "Group": "group"
        }

        sparklio_type = type_map.get(class_name, "shape")

        # 속성 변환
        props = {
            "fill": attrs.get("fill"),
            "stroke": attrs.get("stroke"),
            "strokeWidth": attrs.get("strokeWidth"),
            "opacity": attrs.get("opacity", 1),
            "visible": attrs.get("visible", True)
        }

        # 텍스트 속성
        if sparklio_type == "text":
            props.update({
                "text": attrs.get("text", ""),
                "fontSize": attrs.get("fontSize"),
                "fontFamily": attrs.get("fontFamily"),
                "fontStyle": attrs.get("fontStyle")
            })

        # 이미지 속성
        elif sparklio_type == "image":
            props["src"] = attrs.get("image", {}).get("src", "")

        return {
            "id": attrs.get("id", str(uuid4())),
            "type": sparklio_type,
            "x": attrs.get("x", 0),
            "y": attrs.get("y", 0),
            "width": attrs.get("width", 100),
            "height": attrs.get("height", 100),
            "rotation": attrs.get("rotation", 0),
            "scaleX": attrs.get("scaleX", 1),
            "scaleY": attrs.get("scaleY", 1),
            "props": props
        }

    def _sparklio_to_konva(self, sparklio_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio -> Konva 변환"""
        first_page = sparklio_doc.get("pages", [{}])[0]

        children = []
        for element in first_page.get("elements", []):
            node = self._sparklio_element_to_konva(element)
            if node:
                children.append(node)

        # Konva Stage 구조
        return {
            "attrs": {
                "width": first_page.get("width", 1920),
                "height": first_page.get("height", 1080)
            },
            "className": "Stage",
            "children": [{
                "attrs": {},
                "className": "Layer",
                "children": children
            }]
        }

    def _sparklio_element_to_konva(self, element: Dict[str, Any]) -> Dict[str, Any]:
        """Sparklio 요소 -> Konva 노드 변환"""
        element_type = element.get("type", "")
        props = element.get("props", {})

        # 타입 매핑
        type_map = {
            "text": "Text",
            "image": "Image",
            "shape": "Rect",  # 기본 도형
            "group": "Group"
        }

        konva_class = type_map.get(element_type, "Rect")

        # 기본 속성
        attrs = {
            "id": element.get("id"),
            "x": element.get("x", 0),
            "y": element.get("y", 0),
            "width": element.get("width", 100),
            "height": element.get("height", 100),
            "rotation": element.get("rotation", 0),
            "scaleX": element.get("scaleX", 1),
            "scaleY": element.get("scaleY", 1),
            "fill": props.get("fill"),
            "stroke": props.get("stroke"),
            "strokeWidth": props.get("strokeWidth"),
            "opacity": props.get("opacity", 1),
            "visible": props.get("visible", True)
        }

        # 텍스트 속성
        if element_type == "text":
            attrs.update({
                "text": props.get("text", ""),
                "fontSize": props.get("fontSize"),
                "fontFamily": props.get("fontFamily"),
                "fontStyle": props.get("fontStyle")
            })

        # 이미지는 특별 처리 필요
        elif element_type == "image":
            attrs["image"] = {"src": props.get("src", "")}

        return {
            "attrs": attrs,
            "className": konva_class
        }