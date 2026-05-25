def extract_storage(user_input):
    # Look for storage size like 128GB, 256GB, 512GB, etc.
    match = re.search(r"(\d{2,4})\s*gb", user_input.lower())
    if match:
        return f"{match.group(1)}GB"
    return None
import os

import json
import numpy as np
from dotenv import load_dotenv
from groq import Groq
from sentence_transformers import SentenceTransformer

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ---------------- LOAD PRODUCTS ----------------
with open(os.path.join(os.path.dirname(__file__), "data", "products.json"), "r") as f:
    products = json.load(f)

# ---------------- EMBEDDINGS ----------------
embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
product_texts = [
    f"{p['name']} {p['brand']} {p['subCategory']} "
    f"{' '.join(p['features'])} {' '.join(p['use_case'])}"
    for p in products
]

product_vectors = embed_model.encode(product_texts, normalize_embeddings=True)

# ---------------- PRODUCT SEARCH ----------------

def search_products(query, top_k=5):
    q_vec = embed_model.encode([query], normalize_embeddings=True)
    scores = np.dot(product_vectors, q_vec.T).flatten()

    top_idx = scores.argsort()[-top_k:][::-1]
    results = []
    for i in top_idx:
        if scores[i] > 0.15:
            p = dict(products[i])
            p["_score"] = float(scores[i])
            results.append(p)

    results.sort(key=lambda x: (x["_score"] + x.get("rating", 0) * 0.1), reverse=True)
    return results

# --- Get cheapest products by category ---
def get_cheapest_products(category, top_k=5):
    filtered = [
        p for p in products
        if category and (
            category.lower() in p.get("subCategory", "").lower()
            or category.lower() in p.get("category", "").lower()
        )
    ]
    filtered.sort(key=lambda x: float(x.get("price", 1e9)))
    return filtered[:top_k]
# ---------------- SYSTEM PROMPT ----------------
SYSTEM_PROMPT = """You are a friendly, conversational shopping assistant (like Amazon Rufus).

Your behavior:
- When a user says they want to buy something, IMMEDIATELY recommend top products from the provided catalog context.
- After recommending, naturally ask if they want to narrow down by budget, purpose, or brand.
- If the user mentions a NEW product category (e.g., switches from headphones to phones), start fresh recommendations for that category.
- If the user describes a use case like "gift for a gamer" or "something for travel", pick the best matching products from context.
- Be concise, warm, and helpful. Use bullet points for product lists.
- Always mention price for each product.
- ONLY recommend products from the provided catalog context. NEVER make up products.
- If no matching products are found in the context, say so honestly.
- Compare products when showing multiple options.
- Don't ask too many questions before giving recommendations — recommend first, then refine.
"""

# ---------------- MAIN ----------------
if __name__ == "__main__":
    print("\n🛍️ Shopping Assistant (type 'quit' to exit)\n")

    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]

    while True:
        user_input = input("You: ")
        if user_input.lower() == "quit":
            break

        # Search products based on user query
        matched = search_products(user_input)

        # Build context message with matched products
        if matched:
            product_context = "\n\nRelevant products from our catalog:\n" + json.dumps(matched, indent=2)
            conversation.append({"role": "user", "content": user_input + product_context})
        else:
            conversation.append({"role": "user", "content": user_input + "\n\n[No matching products found in catalog]"})

        # LLM call with full conversation history
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=conversation,
            temperature=0.3,
            max_tokens=1200
        )

        reply = response.choices[0].message.content
        conversation.append({"role": "assistant", "content": reply})

        print("\nAssistant:", reply, "\n")

import re

# --- Helper functions for context extraction ---
def extract_category(user_input):
    import difflib
    # Expanded categories and subcategories from products.json
    categories = [
        "laptop", "mobile", "tablet", "headphones", "earbuds", "smartwatch", "accessories", "phone"
    ]
    user_input_lower = user_input.lower()
    # Direct match
    for cat in categories:
        if cat in user_input_lower:
            return cat
    # Fuzzy match
    words = re.findall(r"\w+", user_input_lower)
    for w in words:
        close = difflib.get_close_matches(w, categories, n=1, cutoff=0.75)
        if close:
            return close[0]
    return None

def extract_color(user_input):
    colors = ["red", "blue", "black", "white", "green", "yellow", "silver", "gold"]
    for color in colors:
        if color in user_input.lower():
            return color
    return None

def extract_brand(user_input):
    brands = ["lenovo", "asus", "dell", "acer", "apple", "xiaomi", "nokia", "nothing", "boat", "noise", "oppo", "fire-boltt", "samsung"]
    for brand in brands:
        if brand in user_input.lower():
            return brand
    return None

def update_context(user_input, context):
    category = extract_category(user_input)
    color = extract_color(user_input)
    brand = extract_brand(user_input)
    storage = extract_storage(user_input)
    if category:
        context['category'] = category
    if color:
        context['color'] = color
    if brand:
        context['brand'] = brand
    if storage:
        context['storage'] = storage
    return context

def build_query(user_input, context):
    query_parts = []
    if 'category' in context:
        query_parts.append(context['category'])
    if 'color' in context:
        query_parts.append(context['color'])
    if 'brand' in context:
        query_parts.append(context['brand'])
    if 'storage' in context:
        query_parts.append(context['storage'])
    query_parts.append(user_input)
    return " ".join(query_parts)

def get_assistant_response(user_input, conversation=None, context=None):
    if not isinstance(conversation, list):
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context is None:
        context = {}
    context = update_context(user_input, context)
    query = build_query(user_input, context)

    # Check for price/budget keywords
    price_keywords = ["less cost", "budget", "cheap", "affordable", "lowest price"]
    any_keywords = ["any one", "anyone", "give me any one", "give me anyone"]

    if any(kw in user_input.lower() for kw in price_keywords):
        if context.get("category"):
            matched = get_cheapest_products(context["category"])
        else:
            # Exclude accessories if no category is set
            results = search_products(user_input)
            matched = [p for p in results if "accessories" not in p.get("subCategory", "").lower()]
    elif any(kw in user_input.lower() for kw in any_keywords) and context.get("category"):
        matched = get_cheapest_products(context["category"], top_k=1)
    else:
        matched = search_products(query)

    # Build context message with matched products
    user_message = str(user_input) if user_input is not None else ""
    if matched:
        # Format the most relevant product in bold (markdown)
        top = matched[0]
        # Build a markdown string for the top product
        top_md = f"**{top['name']}**\n{top['brand']} • {top['subCategory']}\n" + ", ".join(top.get('features', [])) + f"\n{', '.join(top.get('use_case', []))}\n${top['price']}\nRating: {top['rating']}\n"
        # Build markdown for the rest
        if matched:
            # Format the most relevant product in bold (markdown)
            top = matched[0]
            # Build a markdown string for the top product
            top_md = f"**{top['name']}**\n{top['brand']} • {top['subCategory']}\n" + ", ".join(top.get('features', [])) + f"\n{', '.join(top.get('use_case', []))}\n${top['price']}\nRating: {top['rating']}\n"
            # Build markdown for the rest
            rest_md = ""
            for p in matched[1:]:
                rest_md += f"\n{p['name']}\n{p['brand']} • {p['subCategory']}\n" + ", ".join(p.get('features', [])) + f"\n{', '.join(p.get('use_case', []))}\n${p['price']}\nRating: {p['rating']}\n"
            product_context = f"\n\nRelevant products from our catalog:\n{top_md}{rest_md}"
            conversation.append({"role": "user", "content": user_message + product_context})
            # --- Limit memory to last 5 user+assistant pairs (10 messages) plus system prompt ---
            if len(conversation) > 1:
                conversation = [conversation[0]] + conversation[-10:]
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=conversation,
                temperature=0.3,
                max_tokens=1200
            )
            reply = response.choices[0].message.content
            conversation.append({"role": "assistant", "content": reply})
            return reply, matched, context
        else:
            # If no matching products, do NOT append any product context
            available_categories = sorted(set(p['subCategory'] for p in products))
            suggestion_text = "We don't have that in our catalog. Here are some categories you can explore:\n\n" + \
                ", ".join(available_categories) + "\n\nPlease type the category name (e.g., 'laptop', 'phone') to see recommendations."
            conversation.append({"role": "user", "content": user_message + "\n\n[No matching products found in catalog]"})
            conversation.append({"role": "assistant", "content": suggestion_text})
            # --- Limit memory to last 5 user+assistant pairs (10 messages) plus system prompt ---
            if len(conversation) > 1:
                conversation = [conversation[0]] + conversation[-10:]
            # Return the suggestion text as reply, no products
            return suggestion_text, [], context