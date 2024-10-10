"use client";

import { useState, useEffect } from "react";

export interface UsePointsDataResult {
  positions: [number, number, number][];
}

export const usePointsData = (folderName: string): UsePointsDataResult => {
  const [pointsData, setPointsData] = useState<[number, number, number][]>([]);

  useEffect(() => {
    if (folderName) {
      // Fetch the JSON file and process the data
      fetch(`/data/${folderName}/points.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            setPointsData(data);
          } else {
            throw new Error(
              "Invalid JSON structure: positions array missing or incorrect",
            );
          }
        })
        .catch((error) => {
          console.error("Error loading JSON file:", error);
        });
    }
  }, [folderName]);

  return { positions: pointsData };
};
