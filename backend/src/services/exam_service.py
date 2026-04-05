"""
Exam Service for managing exams, students, submissions, and results
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import structlog

from src.config import settings
from src.core.exceptions import ExamNotFoundError, StudentNotFoundError, SubmissionNotFoundError

logger = structlog.get_logger()


class ExamService:
    """Service for managing exams, students, and submissions"""
    
    def __init__(self, neo4j_connection):
        self.neo4j = neo4j_connection
    
    # ==================== EXAM MANAGEMENT ====================
    
    async def create_exam(
        self,
        title: str,
        grade_level: int = 6,
        subject: str = "mathematics",
        duration_minutes: int = 60,
        questions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new exam"""
        exam_id = str(uuid.uuid4())
        
        query = """
        CREATE (e:Exam {
            id: $exam_id,
            title: $title,
            grade_level: $grade_level,
            subject: $subject,
            duration_minutes: $duration_minutes,
            total_points: $total_points,
            created_at: datetime(),
            status: 'draft'
        })
        RETURN e
        """
        
        total_points = sum(q.get("points", 1) for q in (questions or []))
        
        await self.neo4j.execute_write(query, {
            "exam_id": exam_id,
            "title": title,
            "grade_level": grade_level,
            "subject": subject,
            "duration_minutes": duration_minutes,
            "total_points": total_points
        })
        
        # Create questions if provided
        if questions:
            await self._create_questions(exam_id, questions)
        
        logger.info("Exam created", exam_id=exam_id, title=title)
        
        return await self.get_exam(exam_id)
    
    async def _create_questions(
        self,
        exam_id: str,
        questions: List[Dict[str, Any]]
    ) -> None:
        """Create questions for an exam"""
        for idx, q in enumerate(questions):
            question_id = str(uuid.uuid4())
            skills = q.get("skills", ["calculation"])
            topic = q.get("topic", "numbers_operations")
            
            # First create the question and link to exam
            query1 = """
            MATCH (e:Exam {id: $exam_id})
            CREATE (q:Question {
                id: $question_id,
                number: $number,
                text: $text,
                type: $type,
                correct_answer: $correct_answer,
                points: $points,
                skills: $skills,
                topic: $topic
            })
            CREATE (e)-[:HAS_QUESTION {order: $number}]->(q)
            RETURN q.id as qid
            """
            
            await self.neo4j.execute_write(query1, {
                "exam_id": exam_id,
                "question_id": question_id,
                "number": idx + 1,
                "text": q.get("text", ""),
                "type": q.get("type", "calculation"),
                "correct_answer": q.get("correct_answer", ""),
                "points": q.get("points", 1),
                "skills": skills,
                "topic": topic
            })
            
            # Create skill relationships
            for skill_name in skills:
                skill_query = """
                MATCH (q:Question {id: $question_id})
                MERGE (s:Skill {name: $skill_name})
                MERGE (q)-[:TESTS_SKILL]->(s)
                """
                await self.neo4j.execute_write(skill_query, {
                    "question_id": question_id,
                    "skill_name": skill_name
                })
            
            # Create topic relationship
            topic_query = """
            MATCH (q:Question {id: $question_id})
            MERGE (t:Topic {name: $topic})
            MERGE (q)-[:BELONGS_TO]->(t)
            """
            await self.neo4j.execute_write(topic_query, {
                "question_id": question_id,
                "topic": topic
            })
    
    async def get_exam(self, exam_id: str) -> Dict[str, Any]:
        """Get exam details with questions"""
        query = """
        MATCH (e:Exam {id: $exam_id})
        OPTIONAL MATCH (e)-[r:HAS_QUESTION]->(q:Question)
        WITH e, q ORDER BY r.order
        WITH e, collect(q) as questions
        RETURN e.id as id,
               e.title as title,
               e.grade_level as grade_level,
               e.subject as subject,
               e.duration_minutes as duration_minutes,
               e.total_points as total_points,
               e.status as status,
               e.created_at as created_at,
               [q IN questions WHERE q IS NOT NULL | {
                   id: q.id,
                   number: q.number,
                   text: q.text,
                   type: q.type,
                   correct_answer: q.correct_answer,
                   points: q.points,
                   skills: q.skills,
                   topic: q.topic
               }] as questions
        """
        
        results = await self.neo4j.execute_query(query, {"exam_id": exam_id})
        
        if not results:
            raise ExamNotFoundError(f"Exam not found: {exam_id}")
        
        row = results[0]
        return {
            "id": row["id"],
            "title": row["title"],
            "grade_level": row["grade_level"],
            "subject": row["subject"],
            "duration_minutes": row["duration_minutes"],
            "total_points": row["total_points"],
            "status": row["status"],
            "created_at": row["created_at"],
            "questions": row["questions"]
        }
    
    async def list_exams(
        self,
        grade_level: Optional[int] = None,
        subject: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """List exams with optional filters"""
        where_clauses = []
        params = {"skip": skip, "limit": limit}
        
        if grade_level:
            where_clauses.append("e.grade_level = $grade_level")
            params["grade_level"] = grade_level
        
        if subject:
            where_clauses.append("e.subject = $subject")
            params["subject"] = subject
        
        where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Count total first
        count_query = f"""
        MATCH (e:Exam)
        {where_str}
        RETURN count(e) as total
        """
        
        count_results = await self.neo4j.execute_query(count_query, params)
        total = count_results[0]["total"] if count_results else 0
        
        # Get paginated results
        query = f"""
        MATCH (e:Exam)
        {where_str}
        RETURN e.id as id,
               e.title as title,
               e.grade_level as grade_level,
               e.subject as subject,
               e.duration_minutes as duration_minutes,
               e.total_points as total_points,
               e.status as status,
               e.created_at as created_at
        ORDER BY e.created_at DESC
        SKIP $skip
        LIMIT $limit
        """
        
        results = await self.neo4j.execute_query(query, params)
        
        exams = [dict(r) for r in results] if results else []
        
        return {
            "exams": exams,
            "total": total
        }
    
    async def delete_exam(self, exam_id: str) -> bool:
        """Delete an exam and its questions"""
        query = """
        MATCH (e:Exam {id: $exam_id})
        OPTIONAL MATCH (e)-[:HAS_QUESTION]->(q:Question)
        DETACH DELETE e, q
        RETURN count(e) as deleted
        """
        
        results = await self.neo4j.execute_query(query, {"exam_id": exam_id})
        return results[0]["deleted"] > 0 if results else False
    
    # ==================== STUDENT MANAGEMENT ====================
    
    async def create_student(
        self,
        name: str,
        student_number: str,
        class_name: str,
        grade_level: int = 6
    ) -> Dict[str, Any]:
        """Create a new student"""
        student_id = str(uuid.uuid4())
        
        query = """
        CREATE (s:Student {
            id: $student_id,
            name: $name,
            student_number: $student_number,
            class_name: $class_name,
            grade_level: $grade_level,
            created_at: datetime()
        })
        RETURN s
        """
        
        await self.neo4j.execute_write(query, {
            "student_id": student_id,
            "name": name,
            "student_number": student_number,
            "class_name": class_name,
            "grade_level": grade_level
        })
        
        logger.info("Student created", student_id=student_id, name=name)
        
        return await self.get_student(student_id)
    
    async def get_student(self, student_id: str) -> Dict[str, Any]:
        """Get student details"""
        query = """
        MATCH (s:Student {id: $student_id})
        RETURN s
        """
        
        results = await self.neo4j.execute_query(query, {"student_id": student_id})
        
        if not results:
            raise StudentNotFoundError(f"Student not found: {student_id}")
        
        return dict(results[0]["s"])
    
    async def list_students(
        self,
        class_name: Optional[str] = None,
        grade_level: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """List students with optional filters"""
        where_clauses = []
        params = {"skip": skip, "limit": limit}
        
        if class_name:
            where_clauses.append("s.class_name = $class_name")
            params["class_name"] = class_name
        
        if grade_level:
            where_clauses.append("s.grade_level = $grade_level")
            params["grade_level"] = grade_level
        
        where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Count total first
        count_query = f"""
        MATCH (s:Student)
        {where_str}
        RETURN count(s) as total
        """
        
        count_results = await self.neo4j.execute_query(count_query, params)
        total = count_results[0]["total"] if count_results else 0
        
        # Get paginated results
        query = f"""
        MATCH (s:Student)
        {where_str}
        RETURN s.id as id,
               s.name as name,
               s.student_number as student_number,
               s.class_name as class_name,
               s.grade_level as grade_level,
               s.created_at as created_at
        ORDER BY s.name
        SKIP $skip
        LIMIT $limit
        """
        
        results = await self.neo4j.execute_query(query, params)
        
        students = [dict(r) for r in results] if results else []
        
        return {
            "students": students,
            "total": total
        }
    
    # ==================== SUBMISSION MANAGEMENT ====================
    
    async def create_submission(
        self,
        exam_id: str,
        student_id: str,
        answers: List[Dict[str, Any]] = None,
        raw_text: str = None
    ) -> Dict[str, Any]:
        """Create a new exam submission"""
        submission_id = str(uuid.uuid4())
        
        # Verify exam and student exist
        await self.get_exam(exam_id)
        await self.get_student(student_id)
        
        query = """
        MATCH (e:Exam {id: $exam_id})
        MATCH (s:Student {id: $student_id})
        CREATE (sub:Submission {
            id: $submission_id,
            status: 'pending',
            raw_text: $raw_text,
            submitted_at: datetime()
        })
        CREATE (s)-[:SUBMITTED]->(sub)
        CREATE (sub)-[:FOR_EXAM]->(e)
        RETURN sub
        """
        
        await self.neo4j.execute_write(query, {
            "submission_id": submission_id,
            "exam_id": exam_id,
            "student_id": student_id,
            "raw_text": raw_text or ""
        })
        
        # Store answers if provided
        if answers:
            await self._store_answers(submission_id, answers)
        
        logger.info(
            "Submission created",
            submission_id=submission_id,
            exam_id=exam_id,
            student_id=student_id
        )
        
        return await self.get_submission(submission_id)
    
    async def _store_answers(
        self,
        submission_id: str,
        answers: List[Dict[str, Any]]
    ) -> None:
        """Store student answers for a submission"""
        for answer in answers:
            answer_id = str(uuid.uuid4())
            
            query = """
            MATCH (sub:Submission {id: $submission_id})
            MATCH (q:Question {id: $question_id})
            CREATE (a:Answer {
                id: $answer_id,
                question_id: $question_id,
                answer_text: $answer_text,
                created_at: datetime()
            })
            CREATE (sub)-[:HAS_ANSWER]->(a)
            CREATE (a)-[:ANSWERS]->(q)
            """
            
            await self.neo4j.execute_write(query, {
                "submission_id": submission_id,
                "question_id": answer.get("question_id"),
                "answer_id": answer_id,
                "answer_text": answer.get("answer", "")
            })
    
    async def get_submission(self, submission_id: str) -> Dict[str, Any]:
        """Get submission details with answers and correction"""
        # Get basic submission info
        query = """
        MATCH (sub:Submission {id: $submission_id})
        MATCH (s:Student)-[:SUBMITTED]->(sub)
        MATCH (sub)-[:FOR_EXAM]->(e:Exam)
        OPTIONAL MATCH (sub)-[:HAS_CORRECTION]->(c:Correction)
        RETURN sub.id as id,
               sub.status as status,
               sub.raw_text as raw_text,
               sub.submitted_at as submitted_at,
               s.id as student_id,
               s.name as student_name,
               s.student_number as student_number,
               e.id as exam_id,
               e.title as exam_title,
               e.grade_level as exam_grade_level,
               e.subject as exam_subject,
               c.id as correction_id,
               c.total_score as correction_total_score,
               c.percentage as correction_percentage,
               c.feedback as correction_feedback,
               c.corrected_at as correction_corrected_at
        """
        
        results = await self.neo4j.execute_query(query, {"submission_id": submission_id})
        
        if not results:
            raise SubmissionNotFoundError(f"Submission not found: {submission_id}")
        
        row = results[0]
        
        # Get answers separately
        answer_query = """
        MATCH (sub:Submission {id: $submission_id})-[:HAS_ANSWER]->(a:Answer)
        RETURN a.id as id,
               a.question_id as question_id,
               a.answer_text as answer_text,
               a.created_at as created_at
        """
        
        answer_results = await self.neo4j.execute_query(answer_query, {"submission_id": submission_id})
        answers = [dict(r) for r in answer_results] if answer_results else []
        
        return {
            "id": row["id"],
            "status": row["status"],
            "raw_text": row["raw_text"],
            "submitted_at": row["submitted_at"],
            "student": {
                "id": row["student_id"],
                "name": row["student_name"],
                "student_number": row["student_number"]
            },
            "exam": {
                "id": row["exam_id"],
                "title": row["exam_title"],
                "grade_level": row["exam_grade_level"],
                "subject": row["exam_subject"]
            },
            "answers": answers,
            "correction": {
                "id": row["correction_id"],
                "total_score": row["correction_total_score"],
                "percentage": row["correction_percentage"],
                "feedback": row["correction_feedback"],
                "corrected_at": row["correction_corrected_at"]
            } if row["correction_id"] else None
        }
    
    async def list_submissions(
        self,
        exam_id: Optional[str] = None,
        student_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Dict[str, Any]:
        """List submissions with optional filters"""
        where_clauses = []
        params = {"skip": skip, "limit": limit}
        
        if exam_id:
            where_clauses.append("e.id = $exam_id")
            params["exam_id"] = exam_id
        
        if student_id:
            where_clauses.append("s.id = $student_id")
            params["student_id"] = student_id
        
        if status:
            where_clauses.append("sub.status = $status")
            params["status"] = status
        
        where_str = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
        
        # Count total first
        count_query = f"""
        MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)-[:FOR_EXAM]->(e:Exam)
        {where_str}
        RETURN count(sub) as total
        """
        
        count_results = await self.neo4j.execute_query(count_query, params)
        total = count_results[0]["total"] if count_results else 0
        
        # Get paginated results
        query = f"""
        MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)-[:FOR_EXAM]->(e:Exam)
        {where_str}
        OPTIONAL MATCH (sub)-[:HAS_CORRECTION]->(c:Correction)
        RETURN sub.id as submission_id,
               sub.status as submission_status,
               sub.submitted_at as submitted_at,
               s.id as student_id,
               s.name as student_name,
               s.student_number as student_number,
               e.id as exam_id,
               e.title as exam_title,
               c.percentage as score
        ORDER BY sub.submitted_at DESC
        SKIP $skip
        LIMIT $limit
        """
        
        results = await self.neo4j.execute_query(query, params)
        
        submissions = []
        for r in results if results else []:
            submissions.append({
                "submission": {
                    "id": r["submission_id"],
                    "status": r["submission_status"],
                    "submitted_at": r["submitted_at"]
                },
                "student": {
                    "id": r["student_id"],
                    "name": r["student_name"],
                    "student_number": r["student_number"]
                },
                "exam": {
                    "id": r["exam_id"],
                    "title": r["exam_title"]
                },
                "score": r["score"]
            })
        
        return {
            "submissions": submissions,
            "total": total
        }
    
    async def update_submission_status(
        self,
        submission_id: str,
        status: str
    ) -> Dict[str, Any]:
        """Update submission status"""
        query = """
        MATCH (sub:Submission {id: $submission_id})
        SET sub.status = $status, sub.updated_at = datetime()
        RETURN sub
        """
        
        await self.neo4j.execute_write(query, {
            "submission_id": submission_id,
            "status": status
        })
        
        return await self.get_submission(submission_id)
    
    # ==================== STATISTICS ====================
    
    async def get_exam_statistics(self, exam_id: str) -> Dict[str, Any]:
        """Get statistics for an exam"""
        query = """
        MATCH (e:Exam {id: $exam_id})
        OPTIONAL MATCH (sub:Submission)-[:FOR_EXAM]->(e)
        OPTIONAL MATCH (sub)-[:HAS_CORRECTION]->(c:Correction)
        WITH e, collect(c) as corrections
        WITH e, corrections,
             size(corrections) as total_submissions,
             [c in corrections WHERE c IS NOT NULL | c.percentage] as scores
        RETURN {
            exam_id: e.id,
            title: e.title,
            total_submissions: total_submissions,
            corrected: size([s in scores WHERE s IS NOT NULL]),
            average_score: CASE WHEN size(scores) > 0 THEN reduce(sum=0.0, s in scores | sum + s) / size(scores) ELSE 0 END,
            pass_rate: CASE WHEN size(scores) > 0 THEN toFloat(size([s in scores WHERE s >= 50])) / size(scores) * 100 ELSE 0 END,
            highest_score: CASE WHEN size(scores) > 0 THEN reduce(max=0.0, s in scores | CASE WHEN s > max THEN s ELSE max END) ELSE 0 END,
            lowest_score: CASE WHEN size(scores) > 0 THEN reduce(min=100.0, s in scores | CASE WHEN s < min THEN s ELSE min END) ELSE 0 END
        } as stats
        """
        
        results = await self.neo4j.execute_query(query, {"exam_id": exam_id})
        return results[0]["stats"] if results else {}
    
    async def get_student_statistics(self, student_id: str) -> Dict[str, Any]:
        """Get statistics for a student"""
        query = """
        MATCH (s:Student {id: $student_id})
        OPTIONAL MATCH (s)-[:SUBMITTED]->(sub:Submission)-[:HAS_CORRECTION]->(c:Correction)
        WITH s, collect(c) as corrections
        WITH s, corrections,
             [c in corrections WHERE c IS NOT NULL | c.percentage] as scores
        RETURN {
            student_id: s.id,
            name: s.name,
            total_exams: size(corrections),
            average_score: CASE WHEN size(scores) > 0 THEN reduce(sum=0.0, s in scores | sum + s) / size(scores) ELSE 0 END,
            pass_rate: CASE WHEN size(scores) > 0 THEN toFloat(size([s in scores WHERE s >= 50])) / size(scores) * 100 ELSE 0 END,
            highest_score: CASE WHEN size(scores) > 0 THEN reduce(max=0.0, s in scores | CASE WHEN s > max THEN s ELSE max END) ELSE 0 END,
            lowest_score: CASE WHEN size(scores) > 0 THEN reduce(min=100.0, s in scores | CASE WHEN s < min THEN s ELSE min END) ELSE 0 END
        } as stats
        """
        
        results = await self.neo4j.execute_query(query, {"student_id": student_id})
        return results[0]["stats"] if results else {}
    
    async def get_class_statistics(self, class_name: str) -> Dict[str, Any]:
        """Get statistics for a class"""
        query = """
        MATCH (s:Student {class_name: $class_name})
        OPTIONAL MATCH (s)-[:SUBMITTED]->(sub:Submission)-[:HAS_CORRECTION]->(c:Correction)
        WITH s, c
        WITH collect(DISTINCT s) as students, collect(c.percentage) as scores
        RETURN {
            class_name: $class_name,
            total_students: size(students),
            total_exams_taken: size(scores),
            average_score: CASE WHEN size(scores) > 0 THEN reduce(sum=0.0, s in scores | sum + s) / size(scores) ELSE 0 END,
            pass_rate: CASE WHEN size(scores) > 0 THEN toFloat(size([s in scores WHERE s >= 50])) / size(scores) * 100 ELSE 0 END
        } as stats
        """
        
        results = await self.neo4j.execute_query(query, {"class_name": class_name})
        return results[0]["stats"] if results else {}
    
    async def get_error_analysis(
        self,
        exam_id: Optional[str] = None,
        class_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get error analysis for exam or class"""
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
        WITH et.name as error_type, count(et) as count
        WHERE error_type IS NOT NULL
        RETURN collect({{error_type: error_type, count: count}}) as errors
        ORDER BY count DESC
        """
        
        results = await self.neo4j.execute_query(query, params)
        return {"errors": results[0]["errors"] if results else []}
    
    async def get_skill_analysis(
        self,
        student_id: Optional[str] = None,
        class_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get skill mastery analysis"""
        where_clause = ""
        params = {}
        
        if student_id:
            where_clause = "WHERE s.id = $student_id"
            params["student_id"] = student_id
        elif class_name:
            where_clause = "WHERE s.class_name = $class_name"
            params["class_name"] = class_name
        
        query = f"""
        MATCH (s:Student)-[:SUBMITTED]->(sub:Submission)
        {where_clause}
        MATCH (sub)-[:HAS_CORRECTION]->(c:Correction)-[:INCLUDES]->(qc:QuestionCorrection)-[:CORRECTS]->(q:Question)
        MATCH (q)-[:TESTS_SKILL]->(skill:Skill)
        WITH skill.name as skill_name, 
             sum(CASE WHEN qc.is_correct THEN 1 ELSE 0 END) as correct,
             count(qc) as total
        RETURN collect({{
            skill: skill_name, 
            correct: correct, 
            total: total,
            mastery: toFloat(correct) / total * 100
        }}) as skills
        ORDER BY mastery ASC
        """
        
        results = await self.neo4j.execute_query(query, params)
        return {"skills": results[0]["skills"] if results else []}
    
    async def get_overall_stats(self) -> Dict[str, Any]:
        """Get overall system statistics"""
        query = """
        MATCH (e:Exam) WITH count(e) as total_exams
        MATCH (s:Student) WITH total_exams, count(s) as total_students
        MATCH (sub:Submission) WITH total_exams, total_students, count(sub) as total_submissions
        MATCH (c:Correction) WITH total_exams, total_students, total_submissions, count(c) as total_corrections
        OPTIONAL MATCH (c2:Correction)
        WITH total_exams, total_students, total_submissions, total_corrections,
             collect(c2.percentage) as all_scores
        RETURN {
            total_exams: total_exams,
            total_students: total_students,
            total_submissions: total_submissions,
            total_corrections: total_corrections,
            average_score: CASE WHEN size(all_scores) > 0 THEN reduce(sum=0.0, s in all_scores | sum + s) / size(all_scores) ELSE 0 END,
            pass_rate: CASE WHEN size(all_scores) > 0 THEN toFloat(size([s in all_scores WHERE s >= 50])) / size(all_scores) * 100 ELSE 0 END
        } as stats
        """
        
        results = await self.neo4j.execute_query(query, {})
        return results[0]["stats"] if results else {}
