"""
Script to seed the database with sample data for testing
"""
import asyncio
from datetime import datetime
import structlog
from app.core.database import neo4j_connection

logger = structlog.get_logger()


async def create_sample_students():
    """Create sample students"""
    students = [
        {"id": "student-1", "first_name": "Marie", "last_name": "Dupont", "class_name": "6e A", "student_id": "2024001"},
        {"id": "student-2", "first_name": "Lucas", "last_name": "Martin", "class_name": "6e A", "student_id": "2024002"},
        {"id": "student-3", "first_name": "Emma", "last_name": "Bernard", "class_name": "6e A", "student_id": "2024003"},
        {"id": "student-4", "first_name": "Hugo", "last_name": "Petit", "class_name": "6e B", "student_id": "2024004"},
        {"id": "student-5", "first_name": "Léa", "last_name": "Robert", "class_name": "6e B", "student_id": "2024005"},
        {"id": "student-6", "first_name": "Thomas", "last_name": "Durand", "class_name": "6e B", "student_id": "2024006"},
    ]
    
    async with neo4j_connection.get_session() as session:
        for student in students:
            await session.run("""
                MERGE (s:Student {id: $id})
                SET s.first_name = $first_name,
                    s.last_name = $last_name,
                    s.class_name = $class_name,
                    s.student_id = $student_id,
                    s.created_at = datetime()
            """, student)
    
    logger.info(f"Created {len(students)} sample students")
    return students


async def create_sample_topics():
    """Create math topics for 6th grade"""
    topics = [
        {"id": "topic-fractions", "name": "Fractions", "description": "Addition, soustraction et simplification de fractions"},
        {"id": "topic-decimals", "name": "Nombres décimaux", "description": "Opérations avec les nombres décimaux"},
        {"id": "topic-geometry", "name": "Géométrie", "description": "Périmètres, aires et volumes"},
        {"id": "topic-equations", "name": "Équations", "description": "Résolution d'équations simples"},
        {"id": "topic-percentages", "name": "Pourcentages", "description": "Calcul de pourcentages"},
        {"id": "topic-proportionality", "name": "Proportionnalité", "description": "Tableaux et graphiques de proportionnalité"},
    ]
    
    async with neo4j_connection.get_session() as session:
        for topic in topics:
            await session.run("""
                MERGE (t:Topic {id: $id})
                SET t.name = $name,
                    t.description = $description
            """, topic)
    
    logger.info(f"Created {len(topics)} topics")
    return topics


async def create_sample_skills():
    """Create skills for 6th grade math"""
    skills = [
        {"id": "skill-addition", "name": "Addition", "topic_id": "topic-decimals"},
        {"id": "skill-subtraction", "name": "Soustraction", "topic_id": "topic-decimals"},
        {"id": "skill-multiplication", "name": "Multiplication", "topic_id": "topic-decimals"},
        {"id": "skill-division", "name": "Division", "topic_id": "topic-decimals"},
        {"id": "skill-fraction-addition", "name": "Addition de fractions", "topic_id": "topic-fractions"},
        {"id": "skill-fraction-simplify", "name": "Simplification de fractions", "topic_id": "topic-fractions"},
        {"id": "skill-perimeter", "name": "Calcul de périmètre", "topic_id": "topic-geometry"},
        {"id": "skill-area", "name": "Calcul d'aire", "topic_id": "topic-geometry"},
        {"id": "skill-solve-equation", "name": "Résolution d'équation", "topic_id": "topic-equations"},
        {"id": "skill-percentage-calc", "name": "Calcul de pourcentage", "topic_id": "topic-percentages"},
    ]
    
    async with neo4j_connection.get_session() as session:
        for skill in skills:
            await session.run("""
                MERGE (s:Skill {id: $id})
                SET s.name = $name
                WITH s
                MATCH (t:Topic {id: $topic_id})
                MERGE (s)-[:BELONGS_TO]->(t)
            """, skill)
    
    logger.info(f"Created {len(skills)} skills")
    return skills


async def create_sample_error_types():
    """Create common error types"""
    error_types = [
        {"id": "error-calc", "name": "Erreur de calcul", "category": "calculation", 
         "description": "Erreur dans l'exécution des opérations mathématiques"},
        {"id": "error-concept", "name": "Erreur conceptuelle", "category": "conceptual",
         "description": "Mauvaise compréhension du concept mathématique"},
        {"id": "error-procedure", "name": "Erreur de procédure", "category": "procedural",
         "description": "Utilisation d'une méthode incorrecte"},
        {"id": "error-careless", "name": "Erreur d'inattention", "category": "careless",
         "description": "Erreur due à un manque d'attention"},
        {"id": "error-incomplete", "name": "Réponse incomplète", "category": "incomplete",
         "description": "La réponse n'est pas complète"},
        {"id": "error-sign", "name": "Erreur de signe", "category": "calculation",
         "description": "Erreur sur le signe positif/négatif"},
    ]
    
    async with neo4j_connection.get_session() as session:
        for error in error_types:
            await session.run("""
                MERGE (e:ErrorType {id: $id})
                SET e.name = $name,
                    e.category = $category,
                    e.description = $description
            """, error)
    
    logger.info(f"Created {len(error_types)} error types")
    return error_types


async def create_sample_exam():
    """Create a sample exam with questions"""
    exam = {
        "id": "exam-1",
        "title": "Contrôle de mathématiques - Chapitre 3",
        "description": "Évaluation sur les fractions et les nombres décimaux",
        "class_name": "6e",
        "subject": "Mathématiques",
        "duration_minutes": 45,
        "total_points": 20.0
    }
    
    questions = [
        {
            "id": "q-1", "exam_id": "exam-1", "order": 1,
            "text": "Calculer: 3/4 + 1/2",
            "question_type": "fraction",
            "correct_answer": "5/4",
            "points": 2.0,
            "topic": "Fractions",
            "difficulty": 2,
            "solution_steps": ["Trouver le dénominateur commun: 4", "3/4 + 2/4 = 5/4"]
        },
        {
            "id": "q-2", "exam_id": "exam-1", "order": 2,
            "text": "Simplifier la fraction: 12/18",
            "question_type": "fraction",
            "correct_answer": "2/3",
            "points": 2.0,
            "topic": "Fractions",
            "difficulty": 2,
            "solution_steps": ["Trouver le PGCD de 12 et 18: 6", "12÷6 / 18÷6 = 2/3"]
        },
        {
            "id": "q-3", "exam_id": "exam-1", "order": 3,
            "text": "Calculer: 3.5 × 2.4",
            "question_type": "decimal",
            "correct_answer": "8.4",
            "points": 2.0,
            "topic": "Nombres décimaux",
            "difficulty": 2,
            "solution_steps": ["35 × 24 = 840", "Placer la virgule: 8.40 = 8.4"]
        },
        {
            "id": "q-4", "exam_id": "exam-1", "order": 4,
            "text": "Un rectangle a une longueur de 8 cm et une largeur de 5 cm. Calculer son périmètre.",
            "question_type": "geometry",
            "correct_answer": "26 cm",
            "points": 3.0,
            "topic": "Géométrie",
            "difficulty": 1,
            "solution_steps": ["Périmètre = 2 × (longueur + largeur)", "P = 2 × (8 + 5) = 2 × 13 = 26 cm"]
        },
        {
            "id": "q-5", "exam_id": "exam-1", "order": 5,
            "text": "Résoudre l'équation: x + 7 = 15",
            "question_type": "equation",
            "correct_answer": "8",
            "points": 2.0,
            "topic": "Équations",
            "difficulty": 1,
            "solution_steps": ["x + 7 = 15", "x = 15 - 7", "x = 8"]
        },
        {
            "id": "q-6", "exam_id": "exam-1", "order": 6,
            "text": "Calculer 25% de 80",
            "question_type": "percentage",
            "correct_answer": "20",
            "points": 2.0,
            "topic": "Pourcentages",
            "difficulty": 2,
            "solution_steps": ["25% = 25/100 = 0.25", "0.25 × 80 = 20"]
        },
        {
            "id": "q-7", "exam_id": "exam-1", "order": 7,
            "text": "Comparer: 3/5 et 2/3",
            "question_type": "comparison",
            "correct_answer": "3/5 < 2/3",
            "points": 2.0,
            "topic": "Fractions",
            "difficulty": 3,
            "solution_steps": ["Dénominateur commun: 15", "3/5 = 9/15 et 2/3 = 10/15", "9/15 < 10/15 donc 3/5 < 2/3"]
        },
        {
            "id": "q-8", "exam_id": "exam-1", "order": 8,
            "text": "Un jardinier plante 120 fleurs. Il en plante 3/5 le premier jour. Combien de fleurs plante-t-il le premier jour?",
            "question_type": "word_problem",
            "correct_answer": "72",
            "points": 3.0,
            "topic": "Fractions",
            "difficulty": 3,
            "solution_steps": ["3/5 de 120", "= 3/5 × 120", "= (3 × 120) / 5", "= 360 / 5 = 72"]
        },
        {
            "id": "q-9", "exam_id": "exam-1", "order": 9,
            "text": "Calculer l'aire d'un triangle de base 6 cm et de hauteur 4 cm",
            "question_type": "geometry",
            "correct_answer": "12 cm²",
            "points": 2.0,
            "topic": "Géométrie",
            "difficulty": 2,
            "solution_steps": ["Aire = (base × hauteur) / 2", "A = (6 × 4) / 2 = 24 / 2 = 12 cm²"]
        },
    ]
    
    async with neo4j_connection.get_session() as session:
        # Create exam
        await session.run("""
            MERGE (e:Exam {id: $id})
            SET e.title = $title,
                e.description = $description,
                e.class_name = $class_name,
                e.subject = $subject,
                e.duration_minutes = $duration_minutes,
                e.total_points = $total_points,
                e.created_at = datetime()
        """, exam)
        
        # Create questions and link to exam
        for q in questions:
            await session.run("""
                MERGE (q:Question {id: $id})
                SET q.text = $text,
                    q.question_type = $question_type,
                    q.correct_answer = $correct_answer,
                    q.points = $points,
                    q.topic = $topic,
                    q.difficulty = $difficulty,
                    q.solution_steps = $solution_steps,
                    q.order = $order
                WITH q
                MATCH (e:Exam {id: $exam_id})
                MERGE (e)-[:HAS_QUESTION]->(q)
                WITH q
                MATCH (t:Topic {name: $topic})
                MERGE (q)-[:COVERS_TOPIC]->(t)
            """, q)
    
    logger.info(f"Created sample exam with {len(questions)} questions")
    return exam, questions


async def seed_database():
    """Main function to seed all data"""
    logger.info("Starting database seeding...")
    
    try:
        await neo4j_connection.connect()
        await neo4j_connection.init_schema()
        
        await create_sample_topics()
        await create_sample_skills()
        await create_sample_error_types()
        await create_sample_students()
        await create_sample_exam()
        
        logger.info("Database seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        await neo4j_connection.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
