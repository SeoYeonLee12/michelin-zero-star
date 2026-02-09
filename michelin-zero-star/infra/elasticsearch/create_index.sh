#!/bin/bash

echo "Elasticsearch에 michelin_recipes 인덱스 생성 중..."

curl -X PUT "http://localhost:9200/michelin_recipes" \
  -H "Content-Type: application/json" \
  -d '{
  "settings": {
    "analysis": {
      "analyzer": {
        "nori_analyzer": {
          "tokenizer": "nori_tokenizer",
          "filter": ["lowercase", "nori_part_of_speech"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "recipes_id": { "type": "long" },
      
      "categories_id": { "type": "long" },
      "category_name": { "type": "keyword" },
      
      "title": { 
        "type": "text", 
        "analyzer": "nori_analyzer",
        "fields": { "keyword": { "type": "keyword" } }
      },

      "main_image_url": { "type": "keyword", "index": false },
      "description": { "type": "text", "analyzer": "nori_analyzer" },
      
      "cook_time": { "type": "integer" },
      "servings": { "type": "integer" },
      "calories": { "type": "float" },
      
      "tags": { "type": "keyword" },
      
      "ingredients": { 
        "type": "text", 
        "analyzer": "nori_analyzer",
        "fields": { "keyword": { "type": "keyword" } }
      },

      "embedding": {
        "type": "dense_vector",
        "dims": 3072,  // text-embedding-3-large
        "index": true,
        "similarity": "cosine"
      },
      
      "full_text": { "type": "text", "index": false }
    }
  }
}'

echo ""
echo "인덱스 생성 완료"
