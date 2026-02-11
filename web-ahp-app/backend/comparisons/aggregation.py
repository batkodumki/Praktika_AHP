"""
Aggregation algorithms for collaborative expert decision-making.
Implements AIJ (Aggregation of Individual Judgments) method.
"""
from typing import Dict, List, Tuple, TYPE_CHECKING
from .models import Project, Comparison, ProjectCollaborator, AggregatedResult

if TYPE_CHECKING:
    import numpy as np


def calculate_eigenvector_weights(matrix) -> Tuple:
    """
    Calculate weights using eigenvector method.

    Args:
        matrix: n×n comparison matrix

    Returns:
        Tuple of (weights, lambda_max, CI, CR)
    """
    try:
        import numpy as np
    except ImportError:
        raise ImportError(
            "NumPy is required for aggregation calculations. "
            "Install it with: pip install numpy scipy"
        )

    n = len(matrix)

    # Calculate eigenvalues and eigenvectors
    eigenvalues, eigenvectors = np.linalg.eig(matrix)

    # Find principal eigenvector (corresponding to max eigenvalue)
    max_eigenvalue_idx = np.argmax(eigenvalues.real)
    lambda_max = eigenvalues[max_eigenvalue_idx].real
    principal_eigenvector = eigenvectors[:, max_eigenvalue_idx].real

    # Normalize weights to sum to 1
    weights = principal_eigenvector / principal_eigenvector.sum()

    # Calculate Consistency Index (CI)
    CI = (lambda_max - n) / (n - 1) if n > 1 else 0

    # Random Index (RI) values from Saaty
    RI_values = {
        1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
        6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
    }
    RI = RI_values.get(n, 1.49)

    # Calculate Consistency Ratio (CR)
    CR = CI / RI if RI > 0 else 0

    return weights, lambda_max, CI, CR


def aggregate_comparisons_aij(project_id: int) -> Dict:
    """
    Aggregate individual judgments using geometric mean (AIJ method).

    Mathematical justification:
    - Geometric mean preserves reciprocity: if a_ij = x, then a_ji = 1/x
    - Proven by Aczel & Saaty (1983) to be the unique aggregation satisfying:
      * Reciprocity
      * Homogeneity
      * Separability
      * Unanimity

    Formula: a_ij^(group) = (∏_{k=1}^{n} a_ij^(k))^(1/n)

    Args:
        project_id: ID of the project to aggregate

    Returns:
        Dictionary with aggregated results:
        {
            'aggregated_matrix': [[...]],  # 2D list
            'weights': [...],              # List of weights
            'consistency_ratio': float,
            'lambda_max': float,
            'consistency_index': float,
            'num_experts': int,
            'expert_ids': [...]            # List of user IDs
        }
    """
    try:
        import numpy as np
    except ImportError:
        raise ImportError(
            "NumPy is required for aggregation calculations. "
            "Install it with: pip install numpy scipy"
        )

    # Get project
    project = Project.objects.get(id=project_id)
    n = len(project.alternatives)

    if n < 2:
        raise ValueError("Project must have at least 2 alternatives")

    # Get all users who have completed comparisons
    completed_collaborators = ProjectCollaborator.objects.filter(
        project=project,
        status='completed'
    )

    expert_ids = list(completed_collaborators.values_list('user_id', flat=True))

    if len(expert_ids) == 0:
        raise ValueError("No completed comparisons to aggregate")

    # Build comparison matrix for each expert
    user_matrices = {}
    for user_id in expert_ids:
        matrix = np.ones((n, n))
        comparisons = Comparison.objects.filter(
            project=project,
            user_id=user_id
        )

        for comp in comparisons:
            matrix[comp.index_a][comp.index_b] = comp.value
            matrix[comp.index_b][comp.index_a] = 1.0 / comp.value

        user_matrices[user_id] = matrix

    # Aggregate using geometric mean (AIJ)
    aggregated_matrix = np.ones((n, n))
    num_experts = len(user_matrices)

    for i in range(n):
        for j in range(i + 1, n):
            # Geometric mean of all experts' judgments for this pair
            product = 1.0
            for user_id, matrix in user_matrices.items():
                product *= matrix[i][j]

            # Take nth root (geometric mean)
            agg_value = product ** (1.0 / num_experts)

            # Preserve reciprocity
            aggregated_matrix[i][j] = agg_value
            aggregated_matrix[j][i] = 1.0 / agg_value

    # Calculate weights using eigenvector method
    weights, lambda_max, CI, CR = calculate_eigenvector_weights(aggregated_matrix)

    return {
        'aggregated_matrix': aggregated_matrix.tolist(),
        'weights': weights.tolist(),
        'consistency_ratio': CR,
        'lambda_max': lambda_max,
        'consistency_index': CI,
        'num_experts': num_experts,
        'expert_ids': expert_ids
    }


def save_aggregated_result(project_id: int, method: str = 'AIJ') -> AggregatedResult:
    """
    Calculate and save aggregated results for a project.

    Args:
        project_id: ID of the project
        method: Aggregation method ('AIJ' or 'AIP')

    Returns:
        AggregatedResult instance
    """
    if method != 'AIJ':
        raise ValueError("Only AIJ method is currently supported")

    # Calculate aggregation
    result_data = aggregate_comparisons_aij(project_id)

    # Save to database
    project = Project.objects.get(id=project_id)
    aggregated_result = AggregatedResult.objects.create(
        project=project,
        aggregation_method=method,
        num_experts=result_data['num_experts'],
        aggregated_matrix=result_data['aggregated_matrix'],
        final_weights=result_data['weights'],
        consistency_ratio=result_data['consistency_ratio'],
        lambda_max=result_data['lambda_max'],
        consistency_index=result_data['consistency_index'],
        expert_weights={}  # For AIJ, individual weights not needed
    )

    return aggregated_result
