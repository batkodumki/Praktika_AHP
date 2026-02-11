"""
Weight calculation and consistency checking algorithms.
Ported from the original Tkinter application.
"""
import numpy as np
from scipy import linalg


# Random Index values for consistency checking
RANDOM_INDEX = {
    1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90, 5: 1.12,
    6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
    11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
}


def build_comparison_matrix(n, comparisons):
    """
    Build n×n comparison matrix from comparison list.

    Args:
        n: Number of alternatives
        comparisons: List of tuples (i, j, value)

    Returns:
        numpy.ndarray: n×n comparison matrix
    """
    # Initialize with identity (diagonal = 1)
    matrix = np.ones((n, n))

    # Fill upper triangle and reciprocal lower triangle
    for i, j, value in comparisons:
        matrix[i, j] = value
        matrix[j, i] = 1.0 / value if value != 0 else 1.0

    return matrix


def calculate_weights_eigenvector(comparison_matrix):
    """
    Calculate weights using eigenvector method (principal eigenvector).

    Args:
        comparison_matrix: n×n numpy array

    Returns:
        numpy.ndarray: Normalized weight vector (sum = 1)
    """
    # Compute eigenvalues and eigenvectors
    eigenvalues, eigenvectors = linalg.eig(comparison_matrix)

    # Get index of maximum eigenvalue
    max_eigenvalue_index = np.argmax(eigenvalues.real)

    # Get principal eigenvector
    principal_eigenvector = eigenvectors[:, max_eigenvalue_index].real

    # Normalize to positive values
    weights = np.abs(principal_eigenvector)

    # Normalize to sum = 1
    normalized_weights = weights / np.sum(weights)

    return normalized_weights


def calculate_weights_geometric_mean(comparison_matrix):
    """
    Calculate weights using geometric mean method.

    Args:
        comparison_matrix: n×n numpy array

    Returns:
        numpy.ndarray: Normalized weight vector (sum = 1)
    """
    n = comparison_matrix.shape[0]

    # Calculate geometric mean of each row
    geometric_means = np.zeros(n)
    for i in range(n):
        row_product = np.prod(comparison_matrix[i, :])
        geometric_means[i] = np.power(row_product, 1.0 / n)

    # Normalize
    normalized_weights = geometric_means / np.sum(geometric_means)

    return normalized_weights


def calculate_lambda_max(comparison_matrix, weights):
    """
    Calculate lambda max (principal eigenvalue).

    Args:
        comparison_matrix: n×n numpy array
        weights: weight vector

    Returns:
        float: Lambda max value
    """
    n = comparison_matrix.shape[0]

    # Calculate (A * w)
    weighted_sum = comparison_matrix @ weights

    # Calculate lambda_max = average of (A*w)_i / w_i
    ratios = weighted_sum / weights
    lambda_max = np.mean(ratios)

    return lambda_max


def check_consistency(comparison_matrix, weights):
    """
    Check consistency of pairwise comparisons.

    Args:
        comparison_matrix: n×n numpy array
        weights: weight vector

    Returns:
        dict: Consistency metrics
            - lambda_max: Principal eigenvalue
            - CI: Consistency Index
            - CR: Consistency Ratio
            - is_consistent: Boolean (CR ≤ 0.10)
            - recommendations: List of recommendation strings
    """
    n = comparison_matrix.shape[0]

    # Calculate lambda max
    lambda_max = calculate_lambda_max(comparison_matrix, weights)

    # Calculate Consistency Index (CI)
    if n > 1:
        CI = (lambda_max - n) / (n - 1)
    else:
        CI = 0.0

    # Get Random Index
    RI = RANDOM_INDEX.get(n, 1.49)

    # Calculate Consistency Ratio (CR)
    if RI > 0:
        CR = CI / RI
    else:
        CR = 0.0

    # Check if consistent (CR ≤ 0.10)
    is_consistent = CR <= 0.10

    # Generate recommendations
    recommendations = []
    if is_consistent:
        recommendations.append("Judgments are consistent (CR ≤ 0.10)")
    else:
        recommendations.append(f"Judgments are inconsistent (CR = {CR:.4f} > 0.10)")
        recommendations.append("Consider reviewing your pairwise comparisons")
        recommendations.append("Look for contradictory judgments")

    return {
        'lambda_max': float(lambda_max),
        'CI': float(CI),
        'CR': float(CR),
        'is_consistent': is_consistent,
        'recommendations': recommendations
    }


def calculate_rankings(weights):
    """
    Calculate rankings from weights (1 = highest weight).

    Args:
        weights: numpy array of weights

    Returns:
        numpy.ndarray: Rankings (1-indexed)
    """
    # Get indices sorted by weight (descending)
    sorted_indices = np.argsort(-weights)

    # Create ranking array
    rankings = np.zeros(len(weights), dtype=int)
    for rank, idx in enumerate(sorted_indices):
        rankings[idx] = rank + 1

    return rankings
