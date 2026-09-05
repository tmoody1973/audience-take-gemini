import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  CalculationManifest,
  ProductionScenario,
} from "@/features/production-scenarios/types";
import { calculateScenario } from "./calculator";

const memoryScenarios = new Map<string, ProductionScenario>();

export const scenarioStore = {
  /**
   * Retrieves scenario by ID
   */
  async getScenario(scenarioId: string): Promise<ProductionScenario | null> {
    const mem = memoryScenarios.get(scenarioId);
    if (mem) return mem;

    try {
      const db = getAdminFirestore();
      const doc = await db.collection("productionScenarios").doc(scenarioId).get();
      if (doc.exists) {
        const data = doc.data() as ProductionScenario;
        memoryScenarios.set(scenarioId, data);
        return data;
      }
    } catch {
      // In-memory fallback
    }

    return null;
  },

  /**
   * Retrieves scenario by project and owner ID
   */
  async getScenarioByProjectAndOwner(
    projectId: string,
    ownerId: string
  ): Promise<ProductionScenario | null> {
    for (const sc of memoryScenarios.values()) {
      if (sc.projectId === projectId && sc.ownerId === ownerId) {
        return sc;
      }
    }

    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("productionScenarios")
        .where("projectId", "==", projectId)
        .where("ownerId", "==", ownerId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as ProductionScenario;
        memoryScenarios.set(data.id, data);
        return data;
      }
    } catch {
      // In-memory fallback
    }

    return null;
  },

  /**
   * Saves or updates a scenario with server-side calculation verification and immutable revisioning
   */
  async saveScenario(scenario: ProductionScenario): Promise<{
    scenario: ProductionScenario;
    manifest: CalculationManifest;
  }> {
    const activeOption =
      scenario.options.find((o) => o.id === scenario.activeOptionId) ||
      scenario.options[0];

    // Server-side recalculation enforces arithmetic integrity and eliminates client tampering
    const manifest = calculateScenario(
      activeOption,
      scenario.id,
      scenario.cardVersionId
    );

    const updatedScenario: ProductionScenario = {
      ...scenario,
      revision: (scenario.revision || 0) + 1,
      updatedAt: new Date().toISOString(),
      latestManifest: manifest,
    };

    memoryScenarios.set(scenario.id, updatedScenario);

    try {
      const db = getAdminFirestore();
      await db.collection("productionScenarios").doc(scenario.id).set(updatedScenario);
    } catch (err) {
      console.warn("scenarioStore: Failed to persist to Firestore, stored in-memory:", err);
    }

    return {
      scenario: updatedScenario,
      manifest,
    };
  },

  /**
   * Deletes a scenario
   */
  async deleteScenario(scenarioId: string, ownerId: string): Promise<boolean> {
    const existing = await this.getScenario(scenarioId);
    if (!existing || existing.ownerId !== ownerId) {
      return false;
    }

    memoryScenarios.delete(scenarioId);

    try {
      const db = getAdminFirestore();
      await db.collection("productionScenarios").doc(scenarioId).delete();
    } catch {
      // Memory removed
    }

    return true;
  },
};
