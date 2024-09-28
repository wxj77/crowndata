import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTrajectoryDataDual } from "@/utils/useTrajectoryData";
import styles from "@/styles/Evaluation.module.css"; // Import the CSS module
import { useSearchParams } from "next/navigation";

// Define the props type for the component
interface EvaluationDualResponse {
  similarity: number; // Adjust this type based on the actual API response
}

// Helper function to compare arrays of 3D points with tolerance
const arraysAreSimilar = (
  arr1: [number, number, number][],
  arr2: [number, number, number][],
  tolerance: number = 1e-6,
): boolean => {
  if (arr1.length !== arr2.length) return false;

  return arr1.every((value, index) =>
    value.every((coord, i) => Math.abs(coord - arr2[index][i]) <= tolerance),
  );
};

const EvaluationDual: React.FC = () => {
  const [rawScores, setRawScores] = useState<EvaluationDualResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const data1 = searchParams.get("data1") || "default data 1";
  const data2 = searchParams.get("data2") || "default data 2";

  const joints = useMemo(() => ["cartesian_position"], []);

  const { results1: trajectoryDataArray1, results2: trajectoryDataArray2 } =
    useTrajectoryDataDual(data1, data2, joints);

  // Memoize the positions arrays to avoid unnecessary renders
  const positions1 = useMemo(
    () => trajectoryDataArray1[0]?.positions || [],
    [trajectoryDataArray1],
  );
  const positions2 = useMemo(
    () => trajectoryDataArray2[0]?.positions || [],
    [trajectoryDataArray2],
  );

  const nCluster = 5;

  // Memoize the URL to avoid recalculating in useEffect
  const url = useMemo(() => `/api/similarity`, []);

  // Use a ref to store the previous data1 and data2 to prevent multiple calls
  const previousPositionsRef = useRef<{
    positions1: [number, number, number][];
    positions2: [number, number, number][];
  } | null>(null);

  useEffect(() => {
    // Check if positions1 or positions2 have meaningfully changed from the last fetch
    const shouldFetch =
      positions1.length > 0 &&
      positions2.length > 0 &&
      (!previousPositionsRef.current ||
        !arraysAreSimilar(
          previousPositionsRef.current.positions1,
          positions1,
        ) ||
        !arraysAreSimilar(previousPositionsRef.current.positions2, positions2));

    if (shouldFetch) {
      const fetchScore = async () => {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              n_cluster: nCluster,
              data1: {
                positions: positions1,
              },
              data2: {
                positions: positions2,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }

          const data: EvaluationDualResponse = await response.json();
          setRawScores(data);

          // Update the ref to the latest positions
          previousPositionsRef.current = { positions1, positions2 };
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        }
      };

      fetchScore();
    }
  }, [url, nCluster, positions1, positions2]);

  // Memoize the scores calculation based on the rawScores
  const scores = useMemo(() => {
    return rawScores ? { similarity: rawScores.similarity } : null;
  }, [rawScores]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!scores) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Evaluation</h2>
      <ul className={styles.list}>
        {[
          {
            label: "Trajectory Similarity",
            value: scores.similarity.toFixed(3),
          },
        ].map((item, index) => (
          <li key={index} className={styles.listItem}>
            <strong className={styles.label}>{item.label}:</strong>
            <span className={styles.value}>{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EvaluationDual;
