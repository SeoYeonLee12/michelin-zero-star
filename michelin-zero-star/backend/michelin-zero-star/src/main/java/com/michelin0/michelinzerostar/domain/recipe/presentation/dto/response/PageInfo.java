package com.michelin0.michelinzerostar.domain.recipe.presentation.dto.response;

public record PageInfo(
        int currentPage,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {

}
