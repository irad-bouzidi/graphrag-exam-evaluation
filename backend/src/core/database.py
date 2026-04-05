from typing import Optional, Dict, Any, List
from neo4j import AsyncGraphDatabase, AsyncDriver, AsyncSession
from neo4j.time import DateTime as Neo4jDateTime, Date as Neo4jDate, Time as Neo4jTime, Duration as Neo4jDuration
from datetime import datetime, date, time, timedelta
import structlog

from src.config import settings
from src.core.exceptions import Neo4jConnectionError

logger = structlog.get_logger()


def convert_neo4j_types(value: Any) -> Any:
    """Convert Neo4j types to Python native types for JSON serialization"""
    if value is None:
        return None
    elif isinstance(value, Neo4jDateTime):
        return value.to_native().isoformat()
    elif isinstance(value, Neo4jDate):
        return value.to_native().isoformat()
    elif isinstance(value, Neo4jTime):
        return value.to_native().isoformat()
    elif isinstance(value, Neo4jDuration):
        return str(value)
    elif isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, date):
        return value.isoformat()
    elif isinstance(value, time):
        return value.isoformat()
    elif isinstance(value, timedelta):
        return str(value)
    elif isinstance(value, dict):
        return {k: convert_neo4j_types(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [convert_neo4j_types(item) for item in value]
    else:
        return value


class Neo4jConnection:
    """Neo4j database connection manager for Exam Evaluation"""
    
    def __init__(self):
        self.driver: Optional[AsyncDriver] = None
        self.uri = settings.neo4j_uri
        self.user = settings.neo4j_user
        self.password = settings.neo4j_password
        self.database = settings.neo4j_database
    
    async def connect(self) -> None:
        """Establish connection to Neo4j"""
        try:
            self.driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_pool_size=50,
                connection_timeout=30,
                max_transaction_retry_time=30
            )
            # Verify connectivity
            await self.driver.verify_connectivity()
            logger.info("Neo4j connection verified", uri=self.uri)
            
            # Create constraints and indexes
            await self._create_schema()
            
        except Exception as e:
            logger.error("Failed to connect to Neo4j", error=str(e))
            raise Neo4jConnectionError(f"Cannot connect to Neo4j: {str(e)}")
    
    async def close(self) -> None:
        """Close Neo4j connection"""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j connection closed")
    
    async def _create_schema(self) -> None:
        """Create necessary constraints and indexes for exam evaluation"""
        constraints = [
            # Core entities
            "CREATE CONSTRAINT student_id IF NOT EXISTS FOR (s:Student) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT exam_id IF NOT EXISTS FOR (e:Exam) REQUIRE e.id IS UNIQUE",
            "CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE q.id IS UNIQUE",
            "CREATE CONSTRAINT answer_id IF NOT EXISTS FOR (a:Answer) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT submission_id IF NOT EXISTS FOR (s:Submission) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT correction_id IF NOT EXISTS FOR (c:Correction) REQUIRE c.id IS UNIQUE",
            # Reference entities
            "CREATE CONSTRAINT topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE",
            "CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE",
            "CREATE CONSTRAINT error_type_name IF NOT EXISTS FOR (e:ErrorType) REQUIRE e.name IS UNIQUE",
        ]
        
        indexes = [
            "CREATE INDEX exam_created IF NOT EXISTS FOR (e:Exam) ON (e.created_at)",
            "CREATE INDEX exam_grade IF NOT EXISTS FOR (e:Exam) ON (e.grade_level)",
            "CREATE INDEX student_name IF NOT EXISTS FOR (s:Student) ON (s.name)",
            "CREATE INDEX submission_date IF NOT EXISTS FOR (s:Submission) ON (s.submitted_at)",
            "CREATE INDEX question_type IF NOT EXISTS FOR (q:Question) ON (q.type)",
            "CREATE INDEX correction_score IF NOT EXISTS FOR (c:Correction) ON (c.score)",
        ]
        
        # Vector index for question embeddings (for similar question matching)
        vector_index = """
        CREATE VECTOR INDEX question_embedding IF NOT EXISTS FOR (q:Question) ON (q.embedding)
        OPTIONS {indexConfig: {
            `vector.dimensions`: 1536,
            `vector.similarity_function`: 'cosine'
        }}
        """
        
        async with self.get_session() as session:
            for constraint in constraints:
                try:
                    await session.run(constraint)
                except Exception as e:
                    logger.debug(f"Constraint already exists or error: {str(e)}")
            
            for index in indexes:
                try:
                    await session.run(index)
                except Exception as e:
                    logger.debug(f"Index already exists or error: {str(e)}")
            
            # Create vector index separately
            try:
                await session.run(vector_index)
            except Exception as e:
                logger.debug(f"Vector index already exists or error: {str(e)}")
        
        logger.info("Schema constraints and indexes created for exam evaluation")
    
    def get_session(self) -> AsyncSession:
        """Get a new database session"""
        if not self.driver:
            raise Neo4jConnectionError("Driver not initialized")
        return self.driver.session(database=self.database)
    
    async def execute_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a Cypher query and return results"""
        async with self.get_session() as session:
            result = await session.run(query, parameters or {})
            records = await result.data()
            # Convert Neo4j types to Python native types for JSON serialization
            return [convert_neo4j_types(record) for record in records]
    
    async def execute_write(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a write query"""
        async with self.get_session() as session:
            result = await session.run(query, parameters or {})
            summary = await result.consume()
            return {
                "nodes_created": summary.counters.nodes_created,
                "relationships_created": summary.counters.relationships_created,
                "properties_set": summary.counters.properties_set
            }
    
    async def health_check(self) -> bool:
        """Check if database is healthy"""
        try:
            async with self.get_session() as session:
                result = await session.run("RETURN 1 as health")
                record = await result.single()
                return record["health"] == 1
        except Exception as e:
            logger.error("Health check failed", error=str(e))
            return False


# Singleton instance
neo4j_connection = Neo4jConnection()


def get_neo4j() -> Neo4jConnection:
    """Dependency injection for Neo4j connection"""
    return neo4j_connection
