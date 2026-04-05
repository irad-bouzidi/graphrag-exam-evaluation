"""
Graph exploration API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
import structlog

from src.core.database import Neo4jConnection, get_neo4j

logger = structlog.get_logger()

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/overview")
async def get_graph_overview(
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get an overview of the graph structure
    """
    try:
        query = """
        CALL {
            MATCH (n) 
            WITH labels(n) as lbls, count(*) as cnt
            UNWIND lbls as label
            RETURN label, sum(cnt) as count
        }
        RETURN collect({label: label, count: count}) as node_counts
        """
        
        results = await neo4j.execute_query(query, {})
        node_counts = results[0]["node_counts"] if results else []
        
        # Get relationship counts
        rel_query = """
        MATCH ()-[r]->()
        WITH type(r) as rel_type, count(*) as count
        RETURN collect({type: rel_type, count: count}) as rel_counts
        """
        
        rel_results = await neo4j.execute_query(rel_query, {})
        rel_counts = rel_results[0]["rel_counts"] if rel_results else []
        
        return {
            "success": True,
            "nodes": node_counts,
            "relationships": rel_counts
        }
    except Exception as e:
        logger.error("Failed to get graph overview", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/visualization")
async def get_graph_visualization(
    node_type: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get graph data for visualization
    """
    try:
        if node_type:
            query = f"""
            MATCH (n:{node_type})
            WITH n LIMIT $limit
            OPTIONAL MATCH (n)-[r]-(m)
            WITH n, r, m
            LIMIT $limit * 5
            RETURN 
                collect(DISTINCT {{
                    id: id(n),
                    label: labels(n)[0],
                    properties: properties(n)
                }}) + 
                collect(DISTINCT {{
                    id: id(m),
                    label: labels(m)[0],
                    properties: properties(m)
                }}) as nodes,
                collect(DISTINCT {{
                    id: id(r),
                    type: type(r),
                    source: id(startNode(r)),
                    target: id(endNode(r))
                }}) as edges
            """
        else:
            query = """
            MATCH (n)
            WITH n LIMIT $limit
            OPTIONAL MATCH (n)-[r]-(m)
            WITH n, r, m
            LIMIT $limit * 5
            RETURN 
                collect(DISTINCT {
                    id: id(n),
                    label: labels(n)[0],
                    properties: properties(n)
                }) + 
                collect(DISTINCT {
                    id: id(m),
                    label: labels(m)[0],
                    properties: properties(m)
                }) as nodes,
                collect(DISTINCT {
                    id: id(r),
                    type: type(r),
                    source: id(startNode(r)),
                    target: id(endNode(r))
                }) as edges
            """
        
        results = await neo4j.execute_query(query, {"limit": limit})
        
        nodes = []
        edges = []
        
        if results:
            # Filter out nulls and duplicates
            seen_nodes = set()
            for node in results[0].get("nodes", []):
                if node and node.get("id") not in seen_nodes:
                    nodes.append(node)
                    seen_nodes.add(node.get("id"))
            
            seen_edges = set()
            for edge in results[0].get("edges", []):
                if edge and edge.get("id") and edge.get("id") not in seen_edges:
                    edges.append(edge)
                    seen_edges.add(edge.get("id"))
        
        return {
            "success": True,
            "nodes": nodes,
            "edges": edges
        }
    except Exception as e:
        logger.error("Failed to get graph visualization", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/student/{student_id}")
async def get_student_graph(
    student_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get graph centered on a student
    """
    try:
        query = """
        MATCH (s:Student {id: $student_id})
        OPTIONAL MATCH (s)-[r1:SUBMITTED]->(sub:Submission)
        OPTIONAL MATCH (sub)-[r2:FOR_EXAM]->(e:Exam)
        OPTIONAL MATCH (sub)-[r3:HAS_CORRECTION]->(c:Correction)
        OPTIONAL MATCH (c)-[r4:INCLUDES]->(qc:QuestionCorrection)
        WITH s, sub, e, c, qc
        RETURN 
            collect(DISTINCT {id: id(s), label: 'Student', properties: properties(s)}) +
            collect(DISTINCT {id: id(sub), label: 'Submission', properties: properties(sub)}) +
            collect(DISTINCT {id: id(e), label: 'Exam', properties: properties(e)}) +
            collect(DISTINCT {id: id(c), label: 'Correction', properties: properties(c)}) as nodes
        """
        
        results = await neo4j.execute_query(query, {"student_id": student_id})
        
        nodes = []
        if results:
            for node in results[0].get("nodes", []):
                if node and node.get("id"):
                    nodes.append(node)
        
        return {
            "success": True,
            "nodes": nodes,
            "student_id": student_id
        }
    except Exception as e:
        logger.error("Failed to get student graph", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exam/{exam_id}")
async def get_exam_graph(
    exam_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get graph centered on an exam
    """
    try:
        query = """
        MATCH (e:Exam {id: $exam_id})
        OPTIONAL MATCH (e)-[:HAS_QUESTION]->(q:Question)
        OPTIONAL MATCH (q)-[:TESTS_SKILL]->(skill:Skill)
        OPTIONAL MATCH (q)-[:BELONGS_TO]->(topic:Topic)
        OPTIONAL MATCH (sub:Submission)-[:FOR_EXAM]->(e)
        WITH e, q, skill, topic, sub
        RETURN 
            collect(DISTINCT {id: id(e), label: 'Exam', properties: {id: e.id, title: e.title}}) +
            collect(DISTINCT {id: id(q), label: 'Question', properties: {id: q.id, number: q.number, text: q.text}}) +
            collect(DISTINCT {id: id(skill), label: 'Skill', properties: {name: skill.name}}) +
            collect(DISTINCT {id: id(topic), label: 'Topic', properties: {name: topic.name}}) +
            collect(DISTINCT {id: id(sub), label: 'Submission', properties: {id: sub.id, status: sub.status}}) as nodes
        """
        
        results = await neo4j.execute_query(query, {"exam_id": exam_id})
        
        nodes = []
        if results:
            for node in results[0].get("nodes", []):
                if node and node.get("id"):
                    nodes.append(node)
        
        return {
            "success": True,
            "nodes": nodes,
            "exam_id": exam_id
        }
    except Exception as e:
        logger.error("Failed to get exam graph", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/skills")
async def get_skills_graph(
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get skills and topics graph
    """
    try:
        query = """
        MATCH (skill:Skill)
        OPTIONAL MATCH (q:Question)-[:TESTS_SKILL]->(skill)
        OPTIONAL MATCH (q)-[:BELONGS_TO]->(topic:Topic)
        WITH skill, topic, count(q) as question_count
        RETURN collect(DISTINCT {
            id: id(skill),
            label: 'Skill',
            name: skill.name,
            question_count: question_count,
            topics: collect(DISTINCT topic.name)
        }) as skills
        """
        
        results = await neo4j.execute_query(query, {})
        
        return {
            "success": True,
            "skills": results[0]["skills"] if results else []
        }
    except Exception as e:
        logger.error("Failed to get skills graph", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/errors")
async def get_errors_graph(
    exam_id: Optional[str] = None,
    class_name: Optional[str] = None,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get error types distribution
    """
    try:
        where_clause = ""
        params = {}
        
        if exam_id:
            where_clause = "WHERE e.id = $exam_id"
            params["exam_id"] = exam_id
        elif class_name:
            where_clause = "WHERE s.class_name = $class_name"
            params["class_name"] = class_name
        
        query = f"""
        MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)-[:FOR_EXAM]->(e:Exam)
        {where_clause}
        MATCH (sub)-[:HAS_CORRECTION]->(c:Correction)-[:INCLUDES]->(qc:QuestionCorrection)
        OPTIONAL MATCH (qc)-[:HAS_ERROR]->(et:ErrorType)
        WITH et.name as error_type, et.description as description, count(*) as count
        WHERE error_type IS NOT NULL
        RETURN collect({{
            error_type: error_type,
            description: description,
            count: count
        }}) as errors
        ORDER BY count DESC
        """
        
        results = await neo4j.execute_query(query, params)
        
        return {
            "success": True,
            "errors": results[0]["errors"] if results else []
        }
    except Exception as e:
        logger.error("Failed to get errors graph", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
