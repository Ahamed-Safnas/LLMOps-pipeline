#!/usr/bin/env python3
"""
LangSmith Evaluation Script for RAG System

Usage:
    python run_evaluations.py --dataset AgenticAIReportGoldens
    python run_evaluations.py --dataset AgenticAIReportGoldens --evaluator correctness
    python run_evaluations.py --dataset AgenticAIReportGoldens --evaluator cot_qa
    python run_evaluations.py --dataset AgenticAIReportGoldens --evaluator all
"""


# eg code in shell : python run_evaluations.py --dataset AgenticAIReportGoldens --evaluator correctness


import os
import sys
import argparse
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.append(str(PROJECT_ROOT))

from langsmith import evaluate
from langsmith.schemas import Run, Example
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.evaluation import load_evaluator

from multi_doc_chat.src.document_ingestion.data_ingestion import ChatIngestor
from multi_doc_chat.src.document_chat.retrieval import ConversationalRAG


class LocalFileAdapter:
    def __init__(self, file_path: str):
        self.path = Path(file_path)
        self.name = self.path.name

    def getbuffer(self) -> bytes:
        return self.path.read_bytes()


def answer_ai_report_question(
    inputs: dict,
    data_path: str = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    k: int = 5,
) -> dict:
    if data_path is None:
        data_path = str(PROJECT_ROOT / "data" / "The 2025 AI Engineering Report.txt")

    try:
        question = inputs.get("question", "")
        if not question:
            return {"answer": "No question provided"}

        if not Path(data_path).exists():
            return {"answer": f"Data file not found: {data_path}"}

        file_adapter = LocalFileAdapter(data_path)

        ingestor = ChatIngestor(
            temp_base="data",
            faiss_base="faiss_index",
            use_session_dirs=True,
        )

        ingestor.built_retriver(
            uploaded_files=[file_adapter],
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            k=k,
        )

        session_id = ingestor.session_id
        index_path = f"faiss_index/{session_id}"

        rag = ConversationalRAG(session_id=session_id)
        rag.load_retriever_from_faiss(
            index_path=index_path,
            k=k,
            index_name=os.getenv("FAISS_INDEX_NAME", "index"),
        )

        answer = rag.invoke(question, chat_history=[])

        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Error: {str(e)}"}


def correctness_evaluator(run: Run, example: Example) -> dict:
    actual_output = run.outputs.get("answer", "")
    expected_output = example.outputs.get("answer", "")
    input_question = example.inputs.get("question", "")

    eval_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are an evaluator. Judge whether the actual answer is correct compared to the expected answer.

Correctness means factual and semantic alignment.

Return exactly:
Reasoning: [brief reason]
Verdict: [CORRECT or INCORRECT]"""
        ),
        (
            "human",
            """Question:
{input}

Expected Answer:
{expected_output}

Actual Answer:
{actual_output}"""
        ),
    ])

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0,
    )

    chain = eval_prompt | llm

    try:
        response = chain.invoke({
            "input": input_question,
            "expected_output": expected_output,
            "actual_output": actual_output,
        })

        response_text = response.content.strip()

        reasoning = ""
        verdict = ""

        for line in response_text.splitlines():
            line = line.strip()

            if line.lower().startswith("reasoning:"):
                reasoning = line.split(":", 1)[1].strip()

            elif line.lower().startswith("verdict:"):
                verdict = line.split(":", 1)[1].strip().upper()

        verdict_clean = verdict.strip().upper()
        score = 1 if verdict_clean == "CORRECT" else 0

        return {
            "key": "correctness",
            "score": score,
            "comment": f"Reasoning: {reasoning} | Verdict: {verdict_clean}",
        }

    except Exception as e:
        return {
            "key": "correctness",
            "score": 0,
            "comment": f"Error during evaluation: {str(e)}",
        }


def run_evaluation(
    dataset_name: str = "AgenticAIReportGoldens",
    evaluator_type: str = "correctness",
    experiment_prefix: Optional[str] = None,
    description: Optional[str] = None,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    k: int = 5,
):
    print(f"\nRunning Evaluation on Dataset: {dataset_name}")
    print(f"Evaluator Type: {evaluator_type}\n")

    if evaluator_type == "correctness":
        evaluators = [correctness_evaluator]
        exp_prefix = experiment_prefix or "agenticAIReport-correctness"
        desc = description or "RAG evaluation with Groq LLM-as-a-Judge"

    elif evaluator_type == "cot_qa":
        evaluators = [load_evaluator("cot_qa")]
        exp_prefix = experiment_prefix or "agenticAIReport-cot-qa"
        desc = description or "RAG evaluation with LangChain cot_qa evaluator"

    elif evaluator_type == "all":
        evaluators = [
            correctness_evaluator,
            load_evaluator("cot_qa"),
        ]
        exp_prefix = experiment_prefix or "agenticAIReport-multi-eval"
        desc = description or "RAG evaluation with correctness + cot_qa"

    else:
        raise ValueError("Invalid evaluator type. Use: correctness, cot_qa, or all")

    metadata = {
        "variant": "RAG with FAISS and AI Engineering Report",
        "evaluator_type": evaluator_type,
        "judge_model": "openai/gpt-oss-120b",
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap,
        "k": k,
    }

    def target_function(inputs: dict) -> dict:
        return answer_ai_report_question(
            inputs=inputs,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            k=k,
        )

    experiment_results = evaluate(
        target_function,
        data=dataset_name,
        evaluators=evaluators,
        experiment_prefix=exp_prefix,
        description=desc,
        metadata=metadata,
    )

    print("\nEvaluation completed successfully.")
    print("Check LangSmith UI: https://smith.langchain.com/")

    return experiment_results


def main():
    parser = argparse.ArgumentParser(
        description="Run LangSmith evaluations on the RAG system"
    )

    parser.add_argument(
        "--dataset",
        type=str,
        default="AgenticAIReportGoldens",
    )

    parser.add_argument(
        "--evaluator",
        type=str,
        choices=["correctness", "cot_qa", "all"],
        default="correctness",
    )

    parser.add_argument(
        "--experiment-prefix",
        type=str,
        default=None,
    )

    parser.add_argument(
        "--description",
        type=str,
        default=None,
    )

    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
    )

    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=200,
    )

    parser.add_argument(
        "--k",
        type=int,
        default=5,
    )

    args = parser.parse_args()

    required_env_vars = ["LANGSMITH_API_KEY", "GROQ_API_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        print(f"Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)

    try:
        run_evaluation(
            dataset_name=args.dataset,
            evaluator_type=args.evaluator,
            experiment_prefix=args.experiment_prefix,
            description=args.description,
            chunk_size=args.chunk_size,
            chunk_overlap=args.chunk_overlap,
            k=args.k,
        )

    except KeyboardInterrupt:
        print("\nEvaluation interrupted by user.")
        sys.exit(0)

    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()