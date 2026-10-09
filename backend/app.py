from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="AI Research Semantic Service")

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def get_interest_weight(interest: dict) -> float:
    """
    Récupère le poids depuis l'objet envoyé par n8n.
    Accepte aussi une chaîne simple pour compatibilité.
    """
    if isinstance(interest, dict):
        return float(interest.get("weight", 1.0))

    return 1.0


def get_interest_name(interest) -> str:
    if isinstance(interest, dict):
        return interest.get("name", "")

    return str(interest)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "all-MiniLM-L6-v2"
    }


@app.post("/similarity")
def similarity(data: dict):

    article_text = data["text"]
    interests = data["interests"]

    # Extraire les noms pour l'encodage
    interest_names = [get_interest_name(i) for i in interests]

    # Générer les embeddings
    article_embedding = model.encode([article_text])
    interest_embeddings = model.encode(interest_names)

    scores = cosine_similarity(article_embedding, interest_embeddings)[0]

    results = []

    for interest, score in zip(interests, scores):
        raw_score = float(score)
        weight = get_interest_weight(interest)
        weighted_score = raw_score * weight

        results.append({
            "interest": get_interest_name(interest),
            "score": raw_score,
            "weight": weight,
            "weighted_score": weighted_score
        })

    raw_results = sorted(results, key=lambda x: x["score"], reverse=True)
    weighted_results = sorted(results, key=lambda x: x["weighted_score"], reverse=True)

    # Normalisation : on divise par le poids max réellement utilisé
    max_weight = max((r["weight"] for r in results), default=1.0)
    max_weighted_score = weighted_results[0]["weighted_score"]

    normalized_relevance = max_weighted_score / max_weight if max_weight > 0 else 0.0
    normalized_relevance = max(0.0, min(1.0, normalized_relevance))

    relevance_score = normalized_relevance * 100

    best_match = weighted_results[0]

    return {
        "relevance_score": round(relevance_score, 2),

        "best_match": {
            "interest": best_match["interest"],
            "raw_similarity": round(best_match["score"], 4),
            "weight": best_match["weight"],
            "weighted_score": round(best_match["weighted_score"], 4)
        },

        "top_interests": [
            {
                "interest": x["interest"],
                "score": round(x["score"], 4),
                "weight": x["weight"],
                "weighted_score": round(x["weighted_score"], 4)
            }
            for x in raw_results[:3]
        ],

        "top_weighted_interests": [
            {
                "interest": x["interest"],
                "score": round(x["score"], 4),
                "weight": x["weight"],
                "weighted_score": round(x["weighted_score"], 4)
            }
            for x in weighted_results[:3]
        ],

        "all_scores": results
    }