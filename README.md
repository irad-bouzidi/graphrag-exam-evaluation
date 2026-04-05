# Exam Evaluation API

AI-powered exam correction system for primary school mathematics (Grade 6 / CM2) using **Graph RAG** (Retrieval-Augmented Generation) and **Agentic AI** patterns.

## Features

- 📝 **Exam Management**: Create and manage math exams with questions
- 👨‍🎓 **Student Management**: Manage student records and classes
- 📄 **OCR Processing**: Upload scanned exams (PDF/images) with automatic text extraction
- 🤖 **AI Correction**: Automated correction using OpenAI with step-by-step solutions
- 📊 **Graph Analysis**: Explore data relationships using Neo4j
- 📈 **Statistics**: Track student, class, and exam performance
- 🎯 **Skill Analysis**: Identify areas needing improvement
- 🧠 **Vector Search**: Semantic similarity search for questions using embeddings
- 🔗 **Knowledge Graph**: Rich entity relationships for intelligent querying

## High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│   FastAPI API    │────▶│     Neo4j       │
│   (Port 3004)   │     │   (Port 8083)    │     │  (Port 7687)    │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │                        │
                        ┌────────▼─────────┐    ┌────────▼─────────┐
                        │   LangChain /    │    │  Vector Index    │
                        │   LangGraph      │    │  (Embeddings)    │
                        └────────┬─────────┘    └──────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │     OpenAI       │
                        │  (gpt-5-nano)    │
                        └──────────────────┘
```

## Tech Stack

- **Backend**: Python 3.11, FastAPI, Pydantic
- **Database**: Neo4j 5.x (Graph Database with Vector Search)
- **AI Framework**: LangChain, LangGraph (Agentic AI orchestration)
- **LLM**: OpenAI (gpt-5-nano reasoning model + text-embedding-3-small)
- **Math Engine**: SymPy for algebraic expression evaluation
- **OCR**: Tesseract (French + English), PyPDF2, pdf2image
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Visualization**: vis-network for graph visualization

---

## Deep Dive: Application Architecture

### Agentic AI Architecture with LangChain

This application implements an **Agentic AI** pattern using LangChain for intelligent document processing and automated exam correction. The system uses specialized AI agents for different tasks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC AI PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Document   │───▶│    OCR       │───▶│   Exam       │───▶│  Graph    │ │
│  │   Upload     │    │   Agent      │    │   Extractor  │    │  Storage  │ │
│  └──────────────┘    └──────────────┘    │   Agent      │    └───────────┘ │
│                                          └──────────────┘                   │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   Student    │───▶│   Answer     │───▶│   Math       │───▶│  Feedback │ │
│  │   Submission │    │   Extractor  │    │   Corrector  │    │  Generator│ │
│  └──────────────┘    └──────────────┘    │   Agent      │    └───────────┘ │
│                                          └──────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LangChain Integration

The application leverages **LangChain** for structured LLM interactions:

#### 1. Exam Extractor Agent (`exam_extractor_service.py`)

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

class ExamExtractorService:
    """
    LangChain-powered agent for extracting exam structure from OCR text.
    Uses structured prompts with JSON schema enforcement.
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-5-nano",
            temperature=1,  # Reasoning models require temperature=1
            model_kwargs={"max_completion_tokens": 16000}
        )
    
    async def extract_exam_from_text(self, ocr_text: str) -> Dict:
        messages = [
            SystemMessage(content="You are an expert at analyzing exam documents..."),
            HumanMessage(content=EXAM_EXTRACTION_PROMPT.format(ocr_text=ocr_text))
        ]
        response = await self.llm.ainvoke(messages)
        return json.loads(response.content)
```

**Key Capabilities:**
- Extracts questions, answers, metadata from raw OCR text
- Identifies question types (calculation, word_problem, geometry, etc.)
- Maps questions to mathematical skills and topics
- Handles multi-part questions (a, b, c) as separate entities

#### 2. Math Correction Agent (`math_correction_service.py`)

```python
class MathCorrectionService:
    """
    Hybrid correction system combining:
    - SymPy for exact mathematical comparison
    - LangChain for semantic analysis and partial credit
    """
    
    async def correct_question(self, question, student_answer):
        # Step 1: Try exact mathematical comparison with SymPy
        is_correct = await self._compare_math_answers(student_answer, correct_answer)
        
        if not is_correct:
            # Step 2: Use AI agent for detailed analysis
            ai_correction = await self._ai_correct_question(question, student_answer)
            return ai_correction
```

**Correction Pipeline:**
1. **Exact Match**: Direct string comparison
2. **Numeric Evaluation**: Float comparison with tolerance
3. **Algebraic Equivalence**: SymPy symbolic math comparison
4. **AI Analysis**: LangChain agent for partial credit and error identification

### Graph RAG Architecture

The system implements **Graph RAG** (Retrieval-Augmented Generation) using Neo4j:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GRAPH RAG PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐         ┌─────────────────────────────────────────────┐  │
│   │   Query     │────────▶│            NEO4J KNOWLEDGE GRAPH            │  │
│   └─────────────┘         │                                             │  │
│          │                │  (Student)──[:SUBMITTED]──▶(Submission)     │  │
│          │                │      │                          │           │  │
│          ▼                │      │                    [:FOR_EXAM]       │  │
│   ┌─────────────┐         │      │                          │           │  │
│   │   Vector    │         │      │                          ▼           │  │
│   │   Search    │────────▶│      │                       (Exam)         │  │
│   └─────────────┘         │      │                          │           │  │
│          │                │      │                   [:HAS_QUESTION]    │  │
│          │                │      │                          │           │  │
│          ▼                │      │                          ▼           │  │
│   ┌─────────────┐         │      │                     (Question)       │  │
│   │   Context   │         │      │                      /       \       │  │
│   │   Assembly  │         │      │            [:TESTS_SKILL] [:BELONGS_TO]│ │
│   └─────────────┘         │      │                    /           \     │  │
│          │                │      ▼                   ▼             ▼    │  │
│          ▼                │  (Correction)────▶  (Skill)        (Topic)  │  │
│   ┌─────────────┐         │      │                                      │  │
│   │   LLM       │         │  [:HAS_ERROR]                               │  │
│   │   Response  │         │      │                                      │  │
│   └─────────────┘         │      ▼                                      │  │
│                           │  (ErrorType)                                │  │
│                           └─────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Vector Embeddings & Semantic Search

Questions are embedded using OpenAI's `text-embedding-3-small` model and stored in Neo4j's vector index:

```python
# Vector index creation
CREATE VECTOR INDEX question_embedding IF NOT EXISTS 
FOR (q:Question) ON (q.embedding)
OPTIONS {
    indexConfig: {
        `vector.dimensions`: 1536,
        `vector.similarity_function`: 'cosine'
    }
}
```

**Use Cases:**
- Find similar questions across exams
- Identify knowledge gaps by clustering wrong answers
- Recommend practice questions based on student weaknesses

### Knowledge Graph Schema

```cypher
// Core Relationships
(Student)-[:SUBMITTED]->(Submission)-[:FOR_EXAM]->(Exam)
(Submission)-[:HAS_ANSWER]->(Answer)-[:ANSWERS]->(Question)
(Exam)-[:HAS_QUESTION]->(Question)-[:TESTS_SKILL]->(Skill)
(Question)-[:BELONGS_TO]->(Topic)
(Submission)-[:HAS_CORRECTION]->(Correction)-[:INCLUDES]->(QuestionCorrection)
(QuestionCorrection)-[:HAS_ERROR]->(ErrorType)

// Indexes for Performance
CONSTRAINT student_id FOR (s:Student) REQUIRE s.id IS UNIQUE
CONSTRAINT exam_id FOR (e:Exam) REQUIRE e.id IS UNIQUE
CONSTRAINT question_id FOR (q:Question) REQUIRE q.id IS UNIQUE
INDEX question_embedding FOR (q:Question) ON (q.embedding) // Vector index
```

### AI Agent Workflow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        EXAM PROCESSING WORKFLOW                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [1] DOCUMENT UPLOAD                                                       │
│      │                                                                     │
│      ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  DocumentProcessor                                                   │  │
│  │  ├── PDF text extraction (PyPDF2)                                   │  │
│  │  ├── Image OCR (Tesseract - French/English)                         │  │
│  │  └── Text cleaning & normalization                                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│      │                                                                     │
│      ▼                                                                     │
│  [2] EXAM EXTRACTION (LangChain Agent)                                     │
│      │                                                                     │
│      ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ExamExtractorService                                                │  │
│  │  ├── SystemMessage: Expert exam analyzer persona                    │  │
│  │  ├── HumanMessage: OCR text + extraction prompt                     │  │
│  │  ├── LLM Response: Structured JSON with questions                   │  │
│  │  └── Validation: Question types, skills, topics                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│      │                                                                     │
│      ▼                                                                     │
│  [3] GRAPH STORAGE                                                         │
│      │                                                                     │
│      ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Neo4j Operations                                                    │  │
│  │  ├── CREATE (Exam) node with metadata                               │  │
│  │  ├── CREATE (Question) nodes linked to Exam                         │  │
│  │  ├── MERGE (Skill) and (Topic) reference nodes                      │  │
│  │  ├── CREATE [:TESTS_SKILL] and [:BELONGS_TO] relationships          │  │
│  │  └── STORE embedding vectors for semantic search                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                       CORRECTION WORKFLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [1] SUBMISSION RECEIVED                                                   │
│      │                                                                     │
│      ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  For each question:                                                  │  │
│  │                                                                      │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │  Step 1: Exact Mathematical Comparison                      │    │  │
│  │  │  ├── String normalization                                   │    │  │
│  │  │  ├── Numeric evaluation (handle decimals, fractions)        │    │  │
│  │  │  └── SymPy algebraic equivalence check                      │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  │                            │                                         │  │
│  │              ┌─────────────┴─────────────┐                          │  │
│  │              ▼                           ▼                          │  │
│  │         [CORRECT]                   [INCORRECT]                     │  │
│  │              │                           │                          │  │
│  │              ▼                           ▼                          │  │
│  │      Full points              ┌──────────────────────────────┐     │  │
│  │                               │  Step 2: AI Correction Agent │     │  │
│  │                               │  ├── Analyze student logic    │     │  │
│  │                               │  ├── Identify error types     │     │  │
│  │                               │  ├── Calculate partial credit │     │  │
│  │                               │  └── Generate feedback        │     │  │
│  │                               └──────────────────────────────┘     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│      │                                                                     │
│      ▼                                                                     │
│  [2] STORE CORRECTION RESULTS IN GRAPH                                     │
│      │                                                                     │
│      ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  CREATE (Correction) node                                            │  │
│  │  CREATE [:HAS_CORRECTION] from Submission                            │  │
│  │  CREATE (QuestionCorrection) for each answer                         │  │
│  │  MERGE (ErrorType) nodes for identified errors                       │  │
│  │  CREATE [:HAS_ERROR] relationships                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Error Types & Skill Analysis

The AI agent identifies specific error patterns:

| Error Type | Description |
|------------|-------------|
| `calculation_error` | Wrong arithmetic operations |
| `conceptual_error` | Misunderstanding of mathematical concepts |
| `procedural_error` | Wrong method or approach |
| `careless_mistake` | Small slip, but understands concept |
| `incomplete_answer` | Missing parts of the solution |
| `unit_error` | Wrong or missing units |
| `sign_error` | Positive/negative mistakes |
| `decimal_error` | Decimal point misplaced |
| `fraction_error` | Fraction calculation errors |
| `order_of_operations` | PEMDAS/BODMAS violations |

### LangGraph Integration (Future Enhancement)

The architecture is designed to support **LangGraph** for more complex multi-agent workflows:

```python
# Planned LangGraph workflow
from langgraph.graph import StateGraph, END

workflow = StateGraph(CorrectionState)

# Define agent nodes
workflow.add_node("ocr_agent", ocr_agent)
workflow.add_node("extractor_agent", extractor_agent)
workflow.add_node("math_validator", math_validator)
workflow.add_node("ai_corrector", ai_corrector)
workflow.add_node("feedback_generator", feedback_generator)

# Define edges (workflow transitions)
workflow.add_edge("ocr_agent", "extractor_agent")
workflow.add_conditional_edges(
    "math_validator",
    route_based_on_confidence,
    {"high_confidence": "feedback_generator", "low_confidence": "ai_corrector"}
)
workflow.add_edge("ai_corrector", "feedback_generator")
workflow.add_edge("feedback_generator", END)
```

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key

### Setup

1. Clone the repository:
```bash
cd graphrag-exam-evaluation
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure `.env` with your OpenAI credentials:
```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-5-nano
OPENAI_TEMPERATURE=0.2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

4. Start Neo4j first (separate container):
```bash
docker-compose -f docker-compose.neo4j.yml up -d
```

5. Wait for Neo4j to be healthy, then start the API:
```bash
docker-compose -f docker-compose.api.yml build --no-cache api
docker-compose -f docker-compose.api.yml up -d
```

Or use the Makefile shortcuts:
```bash
make neo4j-up          # Start Neo4j
make api-up            # Start API (after Neo4j is ready)
make docker-up         # Start both (Neo4j then API)
```

6. Access the application:
- Frontend: http://localhost:3004 (run `cd frontend && npm run dev`)
- API Docs: http://localhost:8083/docs
- Neo4j Browser: http://localhost:7475 (note: different port to avoid conflicts)

### Docker Commands

```bash
# Neo4j commands
make neo4j-up         # Start Neo4j
make neo4j-down       # Stop Neo4j
make neo4j-logs       # View Neo4j logs

# API commands
make api-build        # Build API image
make api-up           # Start API
make api-down         # Stop API
make api-logs         # View API logs
make api-rebuild      # Rebuild and restart API

# Combined commands
make docker-up        # Start all services
make docker-down      # Stop all services
```

## API Endpoints

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness check with dependencies
- `GET /api/health/stats` - System statistics

### Exams
- `POST /api/exams` - Create an exam
- `GET /api/exams` - List exams
- `GET /api/exams/{id}` - Get exam details
- `DELETE /api/exams/{id}` - Delete exam
- `GET /api/exams/{id}/statistics` - Get exam statistics
- `POST /api/exams/upload` - Upload exam template (OCR)

### Students
- `POST /api/students` - Create a student
- `POST /api/students/bulk` - Bulk create students
- `GET /api/students` - List students
- `GET /api/students/{id}` - Get student details
- `GET /api/students/{id}/statistics` - Get student statistics
- `GET /api/students/{id}/submissions` - Get student submissions
- `GET /api/students/{id}/skills` - Get student skill analysis
- `GET /api/students/class/{class}/statistics` - Get class statistics

### Submissions
- `POST /api/submissions` - Create a submission
- `POST /api/submissions/upload` - Upload scanned submission
- `GET /api/submissions` - List submissions
- `GET /api/submissions/{id}` - Get submission details
- `POST /api/submissions/{id}/correct` - Correct submission with AI
- `POST /api/submissions/{id}/extract-answers` - Extract answers from OCR text
- `GET /api/submissions/{id}/correction` - Get correction details
- `POST /api/submissions/batch/correct` - Batch correct submissions

### Graph
- `GET /api/graph/overview` - Graph structure overview
- `GET /api/graph/visualization` - Graph data for visualization
- `GET /api/graph/student/{id}` - Student-centered graph
- `GET /api/graph/exam/{id}` - Exam-centered graph
- `GET /api/graph/skills` - Skills and topics graph
- `GET /api/graph/errors` - Error types distribution

## Data Model

```
(Student)-[:SUBMITTED]->(Submission)-[:FOR_EXAM]->(Exam)
(Submission)-[:HAS_ANSWER]->(Answer)-[:ANSWERS]->(Question)
(Exam)-[:HAS_QUESTION]->(Question)-[:TESTS_SKILL]->(Skill)
(Question)-[:BELONGS_TO]->(Topic)
(Submission)-[:HAS_CORRECTION]->(Correction)-[:INCLUDES]->(QuestionCorrection)
(QuestionCorrection)-[:HAS_ERROR]->(ErrorType)
```

## Grade 6 Math Topics

| Topic | Skills |
|-------|--------|
| **Numbers & Operations** | Addition, subtraction, multiplication, division, decimals, fractions, percentages, order of operations |
| **Geometry** | Perimeter, area, volume, angles, shapes, symmetry, coordinates |
| **Measurement** | Length, mass, capacity, time, unit conversion, temperature |
| **Problem Solving** | Word problems, multi-step problems, reasoning, estimation, patterns |
| **Ratios & Proportions** | Ratios, proportions, scale, rates |

## Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8083
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | LLM model to use | `gpt-5-nano` |
| `OPENAI_TEMPERATURE` | Model temperature | `0.2` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model | `text-embedding-3-small` |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | `1536` |
| `NEO4J_URI` | Neo4j connection URI | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | Required |
| `API_PORT` | API server port | `8083` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3004` |
| `GRADE_LEVEL` | Default grade level | `6` |
| `PASSING_SCORE` | Passing percentage | `50.0` |

## Project Structure

```
graphrag-exam-evaluation/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route handlers
│   │   ├── core/                # Database, config, exceptions
│   │   ├── models/              # Pydantic models
│   │   └── services/            # Business logic
│   │       ├── document_processor.py    # OCR & PDF processing
│   │       ├── exam_extractor_service.py # LangChain exam extraction
│   │       ├── exam_service.py          # CRUD operations
│   │       └── math_correction_service.py # AI correction engine
│   └── tests/
├── frontend/
│   ├── app/                     # Next.js pages
│   ├── components/              # React components
│   └── lib/                     # API client, utilities
├── docker-compose.yml           # Full stack deployment
├── docker-compose.neo4j.yml     # Neo4j only
└── docker-compose.api.yml       # API only
```

## License

MIT License
