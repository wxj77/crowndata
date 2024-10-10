import * as THREE from "three";
import { useMemo, useRef } from "react";
import { SharedState } from "@/types/pageInterface";

interface PointsCloudProps {
  sharedState: SharedState;
  positions: [number, number, number][];
}

const PointsCloud: React.FC<PointsCloudProps> = ({ positions }) => {
  const pointsRef = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array(positions.flat());
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, [positions]);

  const material = useMemo(
    () => new THREE.PointsMaterial({ color: 0x111111, size: 0.01 }),
    [],
  );

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export default PointsCloud;
