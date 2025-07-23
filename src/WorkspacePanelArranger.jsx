import React, { useState, useRef, useEffect } from "react";

const SCALE = 5;
const SNAP_THRESHOLD_PX = 15;
const SNAP_THRESHOLD_MM = SNAP_THRESHOLD_PX / SCALE;

const STORAGE_KEY = "multi_workspace_panel_arranger_v1";

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

// Default workspace settings
const defaultWorkspace = (name = "Workspace 1") => ({
  name,
  panels: [],
  width: 1220,
  height: 2440,
  spacing: 2,
});

export default function WorkspacePanelArranger() {
  // 1. Load/save all workspaces
  const [workspaces, setWorkspaces] = useState(() => {
    try {
      const all = localStorage.getItem(STORAGE_KEY);
      return all
        ? JSON.parse(all)
        : { "Workspace 1": defaultWorkspace("Workspace 1") };
    } catch {
      return { "Workspace 1": defaultWorkspace("Workspace 1") };
    }
  });

  // 2. Track current workspace
  const [current, setCurrent] = useState(Object.keys(workspaces)[0]);
  // Helper: current workspace obj
  const ws = workspaces[current] || defaultWorkspace();

  // Apply changes to localStorage whenever workspaces change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }, [workspaces]);

  // 3. Handlers to mutate the workspaces state for current workspace only
  const updatePanelState = (nextPanels) => {
    setWorkspaces((all) => ({
      ...all,
      [current]: { ...all[current], panels: nextPanels },
    }));
  };
  const updateSetting = (setting, value) => {
    setWorkspaces((all) => ({
      ...all,
      [current]: { ...all[current], [setting]: value },
    }));
  };
  const addPanel = (w, h, name) => {
    updatePanelState([
      ...ws.panels,
      {
        id: Date.now(),
        name,
        width: w,
        height: h,
        x: 2 * w,
        y: 0,
        rotation: 0,
      },
    ]);
  };
  function rotateAndClampPanel(id) {
    setWorkspaces((all) => {
      const wsObj = all[current];
      const newPanels = wsObj.panels.map((p) => {
        if (p.id !== id) return p;
        // Swap width/height for rotation
        const rotatedWidth = p.height;
        const rotatedHeight = p.width;
        // Clamp new position so it fits after rotation
        let newX = p.x, newY = p.y;
        if (newX + rotatedWidth > wsObj.width) newX = wsObj.width - rotatedWidth;
        if (newY + rotatedHeight > wsObj.height) newY = wsObj.height - rotatedHeight;
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;

        return {
          ...p,
          rotation: (p.rotation + 90) % 360,
          width: rotatedWidth,
          height: rotatedHeight,
          x: newX,
          y: newY,
        };
      });
      return {
        ...all,
        [current]: { ...wsObj, panels: newPanels },
      };
    });
  }

  const updatePanelPosition = (id, x, y) => {
    setWorkspaces((all) => {
      const wsObj = all[current];
      const newPanels = wsObj.panels.map((p) =>
        p.id === id ? { ...p, x, y } : p
      );
      return {
        ...all,
        [current]: { ...wsObj, panels: newPanels },
      };
    });
  };

  const deletePanel = (id) =>
    updatePanelState(ws.panels.filter((p) => p.id !== id));

  const clearWorkspace = () => updatePanelState([]);

  // 4. Add new workspace tab
  const createNewWorkspace = () => {
    let label;
    let idx = Object.keys(workspaces).length + 1;
    do {
      label = `Workspace ${idx++}`;
    } while (workspaces[label]);
    setWorkspaces((all) => ({ ...all, [label]: defaultWorkspace(label) }));
    setCurrent(label);
  };

  const renameWorkspace = (oldName, newName) => {
  if (!newName || newName === oldName || workspaces[newName]) return;

  setWorkspaces((prev) => {
    const updated = { ...prev };
      updated[newName] = { ...updated[oldName], name: newName };
      delete updated[oldName];
      return updated;
    });

    if (current === oldName) setCurrent(newName);
  };

  useEffect(() => {
    setHighlightedPanelId(null);
  }, [current]);

  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  // 5. Font size (global, but can be made per-workspace)
  const [panelFontSize, setPanelFontSize] = useState(16);
  const [panelSizeSize, setPanelSizeSize] = useState(12);

  // For creating panels
  const [newPanelWidth, setNewPanelWidth] = useState("");
  const [newPanelHeight, setNewPanelHeight] = useState("");
  const [newPanelName, setNewPanelName] = useState("");
  const [highlightedPanelId, setHighlightedPanelId] = useState(null);

  const workspaceRef = useRef(null);

  // UI
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>Workspace Panel Arranger</h2>

      {/* Workspace Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        {Object.entries(workspaces).map(([name, obj]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {editingWorkspace === name ? (
              <>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  style={{ width: 100 }}
                />
                <button
                  onClick={() => {
                    renameWorkspace(name, newWorkspaceName);
                    setEditingWorkspace(null);
                  }}
                >
                  ✅
                </button>
                <button onClick={() => setEditingWorkspace(null)}>❌</button>
              </>
            ) : (
              <>
                <button
                  style={{
                    background: name === current ? "#174ea6" : "#ddd",
                    color: name === current ? "#fff" : "#222",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontWeight: name === current ? "bold" : "normal",
                    cursor: "pointer",
                  }}
                  onClick={() => setCurrent(name)}
                  title={name}
                >
                  {name}
                </button>
                <button
                  title="Rename workspace"
                  onClick={() => {
                    setEditingWorkspace(name);
                    setNewWorkspaceName(name);
                  }}
                  style={{
                    background: "#ccc",
                    border: "none",
                    borderRadius: 4,
                    padding: "0px 6px",
                    cursor: "pointer",
                  }}
                >
                  ✏️
                </button>
              </>
            )}
          </div>
        ))}
        <button
          onClick={createNewWorkspace}
          style={{
            background: "#16213e",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            width: 28,
            height: 28,
            fontWeight: "bold",
            fontSize: 15,
            marginLeft: 14,
            cursor: "pointer",
          }}
          title="Create new workspace"
        >
          ＋
        </button>
      </div>

      {/* Workspace Settings Form */}
      <div style={{ marginBottom: 10 }}>
        <label>Workspace Width (mm): </label>
        <input
          type="number"
          value={ws.width}
          onChange={(e) => updateSetting("width", Number(e.target.value))}
          style={{ width: 80, marginRight: 20 }}
        />
        <label>Workspace Height (mm): </label>
        <input
          type="number"
          value={ws.height}
          onChange={(e) => updateSetting("height", Number(e.target.value))}
          style={{ width: 80 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Panel Spacing (mm): </label>
        <input
          type="number"
          value={ws.spacing}
          onChange={(e) => updateSetting("spacing", Number(e.target.value))}
          style={{ width: 50 }}
        />
      </div>
      {/* Panel create */}
      <div style={{ marginBottom: 10 }}>
        <label>New Panel Width (mm): </label>
        <input
          type="number"
          value={newPanelWidth}
          onChange={(e) => setNewPanelWidth(e.target.value)}
          style={{ width: 60, marginRight: 20 }}
        />
        <label>New Panel Height (mm): </label>
        <input
          type="number"
          value={newPanelHeight}
          onChange={(e) => setNewPanelHeight(e.target.value)}
          style={{ width: 60, marginRight: 20 }}
        />
        <label>New Panel Name: </label>
        <input
          type="text"
          value={newPanelName}
          onChange={(e) => setNewPanelName(e.target.value)}
          style={{ width: 80, marginRight: 20 }}
        />
        <button
          onClick={() => {
            const w = parseInt(newPanelWidth, 10);
            const h = parseInt(newPanelHeight, 10);
            if (!isNaN(w) && !isNaN(h)) {
              addPanel(w, h, newPanelName);
              setNewPanelWidth("");
              setNewPanelHeight("");
              setNewPanelName("");
            }
          }}
        >
          Add Panel
        </button>
      </div>
      {/* Font size and clear */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setPanelFontSize((f) => Math.max(8, f - 2))}>A-</button>
        <button
          onClick={() => setPanelFontSize((f) => Math.min(64, f + 2))}
          style={{ marginLeft: 8 }}
        >
          A+
        </button>
        <button onClick={clearWorkspace} style={{ marginLeft: 16 }}>
          Clear Workspace
        </button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setPanelSizeSize((f) => Math.max(8, f - 2))}>A-</button>
        <button
          onClick={() => setPanelSizeSize((f) => Math.min(64, f + 2))}
          style={{ marginLeft: 8 }}
        >
          A+
        </button>
        </div>
      {/* Workspace display */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
        {/* Workspace display */}
        <div
          ref={workspaceRef}
          style={{
            position: "relative",
            border: "2px solid black",
            width: ws.width / SCALE,
            height: ws.height / SCALE,
            marginTop: 20,
            backgroundColor: "#f5f5f5",
            overflow: "visible",
          }}
        >
          {ws.panels.map((panel) => (
            <DraggablePanel
              key={panel.id}
              panel={panel}
              spacing={ws.spacing}
              scale={SCALE}
              updatePosition={updatePanelPosition}
              rotateAndClampPanel={rotateAndClampPanel}
              allPanels={ws.panels}
              deletePanel={deletePanel}
              panelFontSize={panelFontSize}
              panelSizeSize={panelSizeSize}
              workspaceSize={{ width: ws.width, height: ws.height }}
              workspaceRef={workspaceRef}
              highlighted={panel.id === highlightedPanelId}
            />
          ))}
        </div>

        {/* --- Panel Table (NEW) --- */}
        <div style={{ minWidth: 250 }}>
          <h3 style={{ marginBottom: 8 }}>Panels in Current Workspace</h3>
          <table style={{
            borderCollapse: "collapse",
            width: "100%",
            background: "#fff",
            border: "1px solid #333",
            fontSize: 15
          }}>
            <thead>
              <tr style={{ background: "black" }}>
                <th style={{ border: "1px solid #888", padding: "4px 8px" }}>Name</th>
                <th style={{ border: "1px solid #888", padding: "4px 8px" }}>Width (mm)</th>
                <th style={{ border: "1px solid #888", padding: "4px 8px" }}>Height (mm)</th>
              </tr>
            </thead>
            <tbody>
  {ws.panels.length === 0 ? (
    <tr>
      <td colSpan={3} style={{ textAlign: "center", color: "#aaa", padding: 10 }}>
        — No panels —
      </td>
    </tr>
  ) : (
    ws.panels.map((panel) => (
      <tr
        key={panel.id}
        style={{
          background: panel.id === highlightedPanelId ? "#fff3cd" : undefined,
          cursor: "pointer",
        }}
        onClick={() => setHighlightedPanelId(panel.id)}
      >
        <td style={{ border: "1px solid #aaa", padding: "3px 8px", color: "black" }}>{panel.name || panel.id}</td>
        <td style={{ border: "1px solid #aaa", padding: "3px 8px", textAlign: "right", color: "black" }}>{panel.width}</td>
        <td style={{ border: "1px solid #aaa", padding: "3px 8px", textAlign: "right", color: "black" }}>{panel.height}</td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DraggablePanel({
  panel,
  spacing,
  scale,
  updatePosition,
  rotateAndClampPanel,
  allPanels,
  deletePanel,
  panelFontSize,
  panelSizeSize,
  workspaceSize,
  workspaceRef,
  highlighted
}) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  // Helper functions
  const getBoundingBox = (p) => ({
    left: p.x,
    right: p.x + p.width,
    top: p.y,
    bottom: p.y + p.height,
    width: p.width,
    height: p.height,
  });

  const isOverlap = (a, b) => {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  };

  const panelBox = getBoundingBox(panel);
  const anyOverlap = allPanels.some(
    (p) => p.id !== panel.id && isOverlap(panelBox, getBoundingBox(p))
  );

  const outOfBounds =
    panel.x < 0 ||
    panel.y < 0 ||
    panel.x + panel.width > workspaceSize.width ||
    panel.y + panel.height > workspaceSize.height;

  // SNAP/DRAG LOGIC
  const snapToNearbyPanels = (currentX, currentY) => {
    const currentBox = getBoundingBox({ ...panel, x: currentX, y: currentY });
    let snappedX = currentX;
    let snappedY = currentY;

    let xDelta = Infinity;
    let yDelta = Infinity;

    for (let other of allPanels) {
      if (other.id === panel.id) continue;
      const otherBox = getBoundingBox(other);

      let delta = Math.abs(currentBox.right + spacing - otherBox.left);
      if (delta < SNAP_THRESHOLD_MM && delta < xDelta) {
        snappedX = otherBox.left - currentBox.width - spacing;
        xDelta = delta;
      }
      delta = Math.abs(currentBox.left - (otherBox.right + spacing));
      if (delta < SNAP_THRESHOLD_MM && delta < xDelta) {
        snappedX = otherBox.right + spacing;
        xDelta = delta;
      }
      delta = Math.abs(currentBox.bottom + spacing - otherBox.top);
      if (delta < SNAP_THRESHOLD_MM && delta < yDelta) {
        snappedY = otherBox.top - currentBox.height - spacing;
        yDelta = delta;
      }
      delta = Math.abs(currentBox.top - (otherBox.bottom + spacing));
      if (delta < SNAP_THRESHOLD_MM && delta < yDelta) {
        snappedY = otherBox.bottom + spacing;
        yDelta = delta;
      }
    }

    // no overlap after snapping
    const finalBox = getBoundingBox({ ...panel, x: snappedX, y: snappedY });
    const isOverlapping = allPanels.some(
      (p) => p.id !== panel.id && isOverlap(finalBox, getBoundingBox(p))
    );

    snappedX = clamp(snappedX, 0, workspaceSize.width - panel.width);
    snappedY = clamp(snappedY, 0, workspaceSize.height - panel.height);

    return { x: snappedX, y: snappedY };
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      const containerRect = workspaceRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;
      let newXmm = (mouseX - offset.current.x) * scale;
      let newYmm = (mouseY - offset.current.y) * scale;
      newXmm = clamp(newXmm, 0, workspaceSize.width - panel.width);
      newYmm = clamp(newYmm, 0, workspaceSize.height - panel.height);
      const snapped = snapToNearbyPanels(newXmm, newYmm);
      updatePosition(panel.id, snapped.x, snapped.y);
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line
  }, [
    dragging,
    allPanels,
    panel.width,
    panel.height,
    workspaceSize.width,
    workspaceSize.height,
    spacing,
    scale,
  ]);

  const onMouseDown = (e) => {
    const panelRect = ref.current.getBoundingClientRect();
    offset.current = {
      x: e.clientX - panelRect.left,
      y: e.clientY - panelRect.top,
    };
    setDragging(true);
    e.stopPropagation();
    e.preventDefault();
  };

  const onDoubleClick = () => {
    rotateAndClampPanel(panel.id);
  };


  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      style={{
        position: "absolute",
        left: panel.x / scale,
        top: panel.y / scale,
        width: panel.width / scale,
        height: panel.height / scale,
        backgroundColor:
          highlighted
            ? "orange"
            : anyOverlap || outOfBounds
            ? "#f44336"
            : dragging
            ? "#219ebc"
            : "#8ecae6",
        border: "2px solid #023047",
        boxSizing: "border-box",
        cursor: "move",
        userSelect: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "black",
        fontWeight: "bold",
        transition: dragging ? "none" : "background 0.15s",
        overflow: "hidden",
      }}
      title="Double click to rotate"
    >
      {/* Delete button */}
      <button
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "none",
          background: "#f44336",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 10,
          padding: 0,
          lineHeight: "20px",
          textAlign: "center",
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          deletePanel(panel.id);
        }}
        title="Delete panel"
      >
        ×
      </button>
      {/* Width label */}
      <div
        style={{
          position: "absolute",
          bottom: "-5px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: panelSizeSize,
          opacity: 0.8,
          pointerEvents: "none",
          fontWeight: "bold",
        }}
      >
        {panel.width}
      </div>
      {/* Height label */}
      <div
        style={{
          position: "absolute",
          left: "-5px",
          top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          fontSize: panelSizeSize,
          opacity: 0.8,
          pointerEvents: "none",
          fontWeight: "bold",
          whiteSpace: "nowrap",
        }}
      >
        {panel.height}
      </div>
      {/* Panel name, horizontal/vertical */}
      <div
        style={{
          textAlign: "center",
          fontSize: panelFontSize,
          fontWeight: "bold",
          pointerEvents: "none",
          zIndex: 1,
          transform: panel.width >= panel.height ? "none" : "rotate(-90deg)",
          whiteSpace: "nowrap",
        }}
      >
        {panel.name || panel.id}
      </div>
    </div>
  );
}
