"""
Scale implementations for pairwise comparisons.
Ported from the original Tkinter application.
"""
import math
import numpy as np


class Scale:
    """Base class for all scale types."""

    def __init__(self, gradations=9):
        """
        Initialize scale with number of gradations.

        Args:
            gradations: Number of gradations (3-9)
        """
        self.gradations = min(max(gradations, 3), 9)
        self.values = self._calculate_values()

    def _calculate_values(self):
        """Calculate scale values. Must be implemented by subclasses."""
        raise NotImplementedError

    def unify(self, gradation_index):
        """
        Unify gradation to cardinal scale (1.5 to 9.5).

        Args:
            gradation_index: Index of gradation (1 to n)

        Returns:
            Unified value in range [1.5, 9.5]
        """
        n = self.gradations
        l = 1.5  # Lower bound
        p = 9.5  # Upper bound

        # M_i^n = l + (i - 0.5) * (p - l) / n
        unified = l + (gradation_index - 0.5) * (p - l) / n
        return unified


class IntegerScale(Scale):
    """Integer scale (1-9)."""

    def _calculate_values(self):
        """Generate integer values 1 through gradations."""
        return list(range(1, self.gradations + 1))


class BalancedScale(Scale):
    """Balanced scale using weight ratio formula."""

    def _calculate_values(self):
        """
        Generate balanced scale values.
        Formula: a = w / (1 - w), where w = i / (n + 1)
        """
        n = self.gradations
        values = []

        for i in range(1, n + 1):
            w = i / (n + 1)
            if w < 1:
                a = w / (1 - w)
            else:
                a = 9.0
            values.append(a)

        return values


class PowerScale(Scale):
    """Power scale using exponential growth."""

    def _calculate_values(self):
        """
        Generate power scale values.
        Formula: a = 9^((i-1)/(n-1))
        """
        n = self.gradations
        values = []

        for i in range(1, n + 1):
            if n > 1:
                exponent = (i - 1) / (n - 1)
                a = math.pow(9, exponent)
            else:
                a = 1.0
            values.append(a)

        return values


class MaZhengScale(Scale):
    """Ma-Zheng scale."""

    def _calculate_values(self):
        """
        Generate Ma-Zheng scale values.
        Formula: a = 9 / (9 + 1 - grade)
        """
        values = []

        for grade in range(1, self.gradations + 1):
            a = 9 / (9 + 1 - grade)
            values.append(a)

        return values


class DoneganScale(Scale):
    """Donegan scale using hyperbolic tangent."""

    def _calculate_values(self):
        """
        Generate Donegan scale values.
        Formula: a = exp(atanh((grade-1)/14 * sqrt(3)))
        """
        values = []

        for grade in range(1, self.gradations + 1):
            try:
                # atanh argument must be in (-1, 1)
                arg = (grade - 1) / 14 * math.sqrt(3)
                arg = min(max(arg, -0.999), 0.999)  # Clamp to valid range

                a = math.exp(math.atanh(arg))
                values.append(a)
            except (ValueError, OverflowError):
                values.append(1.0)

        return values


def get_scale(scale_type, gradations=9):
    """
    Factory function to get appropriate scale instance.

    Args:
        scale_type: Integer 1-5 representing scale type
        gradations: Number of gradations (3-9)

    Returns:
        Scale instance
    """
    scale_classes = {
        1: IntegerScale,
        2: BalancedScale,
        3: PowerScale,
        4: MaZhengScale,
        5: DoneganScale,
    }

    scale_class = scale_classes.get(scale_type, IntegerScale)
    return scale_class(gradations)


def integer_by_scale(grade, scale_type):
    """
    Transform a grade (1-9) using the specified scale type.

    Args:
        grade: Grade value (1-9)
        scale_type: Scale type (1-5)

    Returns:
        Transformed value
    """
    grade = max(1, min(9, grade))  # Clamp to 1-9

    if scale_type == 1:  # Integer
        return float(grade)

    elif scale_type == 2:  # Balanced
        w = 0.5 + (grade - 1) * 0.05
        if w < 1:
            return w / (1 - w)
        return 9.0

    elif scale_type == 3:  # Power
        return math.pow(9, (grade - 1) / 8)

    elif scale_type == 4:  # Ma-Zheng
        return 9 / (9 + 1 - grade)

    elif scale_type == 5:  # Donegan
        try:
            arg = (grade - 1) / 14 * math.sqrt(3)
            arg = min(max(arg, -0.999), 0.999)
            return math.exp(math.atanh(arg))
        except (ValueError, OverflowError):
            return 1.0

    return float(grade)


def get_progressive_labels(gradations):
    """
    Get labels for progressive refinement scales.

    Args:
        gradations: Number of gradations (3-9)

    Returns:
        List of label strings
    """
    # Base labels for 3 gradations
    base_labels = ["Weak", "Strong", "Extreme"]

    # Progressive expansion
    labels_map = {
        3: ["Weak", "Strong", "Extreme"],
        4: ["Weak", "Medium", "Strong", "Extreme"],
        5: ["Weak", "Medium", "Above Medium", "Strong", "Extreme"],
        6: ["Weak", "Medium", "Above Medium", "Strong", "Very Strong", "Extreme"],
        7: ["Weak", "Medium", "Above Medium", "Strong", "Very Strong", "Very Very Strong", "Extreme"],
        8: ["Weak", "Medium", "Above Medium", "Strong", "Very Strong", "Very Very Strong", "Extremely Strong", "Absolute"],
        9: ["Weak", "Medium", "Above Medium", "Strong", "Very Strong", "Very Very Strong", "Extremely Strong", "Nearly Absolute", "Absolute"],
    }

    return labels_map.get(gradations, base_labels)
