import React, { useState, useRef, useEffect } from 'react';

const SCALE = 5;
const SNAP_THRESHOLD_PX = 200; // in screen px
const SNAP_THRESHOLD_MM = SNAP_THRESHOLD_PX / SCALE;

function clamp(val, min, max) {
  return Math.max(min, Math.min(val, max));
}

const WorkspacePanelArranger = () => {
  const PANELS_STORAGE_KEY = "workspace_panels_v1";
  const WORKSPACE_SETTINGS_KEY = "workspace_settings_v1";
  const SPACING_STORAGE_KEY = "workspace_spacing_v1";
  const [workspaceWidth, setWorkspaceWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_SETTINGS_KEY);
      return saved ? JSON.parse(saved).width : 1220;
    } catch {
      return 1220;
    }
  });
  const [workspaceHeight, setWorkspaceHeight] = useState(() => {
    try {
      const saved = localStorage.getItem(WORKSPACE_SETTINGS_KEY);
      return saved ? JSON.parse(saved).height : 2440;
    } catch {
      return 2440;
    }
  });

  useEffect(() => {
  localStorage.setItem(
    WORKSPACE_SETTINGS_KEY,
    JSON.stringify({ width: workspaceWidth, height: workspaceHeight })
  );
  }, [workspaceWidth, workspaceHeight]);

  const [spacing, setSpacing] = useState(() => {
    try {
      const saved = localStorage.getItem(SPACING_STORAGE_KEY);
      return saved ? JSON.parse(saved) : 2;
    } catch {
      return 2;
    }
  });

  useEffect(() => {
  localStorage.setItem(SPACING_STORAGE_KEY, JSON.stringify(spacing));
  }, [spacing]);

  const [panels, setPanels] = useState(() => {
    try {
      const saved = localStorage.getItem(PANELS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
  localStorage.setItem(PANELS_STORAGE_KEY, JSON.stringify(panels));
  }, [panels]);

  const [newPanelWidth, setNewPanelWidth] = useState('');
  const [newPanelHeight, setNewPanelHeight] = useState('');
  const [newPanelName, setNewPanelName] = useState('');
  const [panelFontSize, setPanelFontSize] = useState(16);

  const workspaceRef = useRef(null);

  const addPanel = () => {
    const width = parseInt(newPanelWidth, 10);
    const height = parseInt(newPanelHeight, 10);
    const name = newPanelName;
    if (!isNaN(width) && !isNaN(height)) {
      setPanels([
        ...panels,
        {
          id: Date.now(),
          name,
          width,
          height,
          x: (2*width),
          y: 0,
          rotation: 0,
        },
      ]);
      setNewPanelWidth('');
      setNewPanelHeight('');
      setNewPanelName('');
    }
  };

  const updatePanelPosition = (id, x, y) => {
    setPanels(panels =>
      panels.map(p => (p.id === id ? { ...p, x, y } : p))
    );
  };

  const rotatePanel = (id) => {
    setPanels(panels =>
      panels.map(p => {
        if (p.id === id) {
          const newRotation = (p.rotation + 90) % 360;
          return {
            ...p,
            rotation: newRotation,
            width: (newRotation === 90 || newRotation === 270) ? p.height : p.width,
            height: (newRotation === 90 || newRotation === 270) ? p.width : p.height,
            // Make sure to keep position the same for now
          };
        }
        return p;
      })
    );
  };

  const deletePanel = (id) => {
    setPanels(panels => panels.filter(panel => panel.id !== id));
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Workspace Panel Arranger</h2>

      <div style={{ marginBottom: 10 }}>
        <label>Workspace Width (mm): </label>
        <input
          type="number"
          value={workspaceWidth}
          onChange={e => setWorkspaceWidth(Number(e.target.value))}
          style={{ width: 80, marginRight: 20 }}
        />
        <label>Workspace Height (mm): </label>
        <input
          type="number"
          value={workspaceHeight}
          onChange={e => setWorkspaceHeight(Number(e.target.value))}
          style={{ width: 80 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Panel Spacing (mm): </label>
        <input
          type="number"
          value={spacing}
          onChange={e => setSpacing(Number(e.target.value))}
          style={{ width: 50 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>New Panel Width (mm): </label>
        <input
          type="number"
          value={newPanelWidth}
          onChange={e => setNewPanelWidth(e.target.value)}
          style={{ width: 60, marginRight: 20 }}
        />
        <label>New Panel Height (mm): </label>
        <input
          type="number"
          value={newPanelHeight}
          onChange={e => setNewPanelHeight(e.target.value)}
          style={{ width: 60, marginRight: 20 }}
        />
        <label>New Panel Name: </label>
        <input
          type="text"
          value={newPanelName}
          onChange={e => setNewPanelName(e.target.value)}
          style={{ width: 60, marginRight: 20 }}
        />
        <button onClick={addPanel}>Add Panel</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setPanelFontSize(f => Math.max(8, f - 2))}>
          A-
        </button>
        <button onClick={() => setPanelFontSize(f => Math.min(64, f + 2))} style={{ marginLeft: 8 }}>
          A+
        </button>
        <button onClick={() => setPanels([])}>
          Clear Workspace
        </button>
      </div>


      <div
        ref={workspaceRef}
        style={{
          position: 'relative',
          border: '2px solid black',
          width: workspaceWidth / SCALE,
          height: workspaceHeight / SCALE,
          marginTop: 20,
          backgroundColor: '#f5f5f5',
          overflow: 'visible'
        }}
      >
        {panels.map(panel => (
          <DraggablePanel
            key={panel.id}
            panel={panel}
            spacing={spacing} // in mm
            scale={SCALE}
            updatePosition={updatePanelPosition}
            rotatePanel={rotatePanel}
            allPanels={panels}
            deletePanel={deletePanel}
            panelFontSize={panelFontSize}
            workspaceSize={{ width: workspaceWidth, height: workspaceHeight }}
            workspaceRef={workspaceRef}
          />
        ))}
      </div>
    </div>
  );
};

const DraggablePanel = ({
  panel,
  spacing,
  scale,
  updatePosition,
  rotatePanel,
  allPanels,
  deletePanel,
  panelFontSize,
  workspaceSize,
  workspaceRef
}) => {
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
    height: p.height
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
    p => p.id !== panel.id && isOverlap(panelBox, getBoundingBox(p))
  );

  const outOfBounds =
  panel.x < 0 ||
  panel.y < 0 ||
  panel.x + panel.width > workspaceSize.width ||
  panel.y + panel.height > workspaceSize.height;

  /**
   * Try to snap current panel to others, but only within snap px threshold.
   */
  const snapToNearbyPanels = (currentX, currentY) => {
  const currentBox = getBoundingBox({ ...panel, x: currentX, y: currentY });
  let snappedX = currentX;
  let snappedY = currentY;

  let xDelta = Infinity;
  let yDelta = Infinity;

  for (let other of allPanels) {
    if (other.id === panel.id) continue;
    const otherBox = getBoundingBox(other);

    // Right edge to other's left
    let delta = Math.abs((currentBox.right + spacing) - otherBox.left);
    if (delta < SNAP_THRESHOLD_MM && delta < xDelta) {
      snappedX = otherBox.left - currentBox.width - spacing;
      xDelta = delta;
    }
    // Left edge to other's right
    delta = Math.abs(currentBox.left - (otherBox.right + spacing));
    if (delta < SNAP_THRESHOLD_MM && delta < xDelta) {
      snappedX = otherBox.right + spacing;
      xDelta = delta;
    }

    // Bottom edge to other's top
    delta = Math.abs((currentBox.bottom + spacing) - otherBox.top);
    if (delta < SNAP_THRESHOLD_MM && delta < yDelta) {
      snappedY = otherBox.top - currentBox.height - spacing;
      yDelta = delta;
    }
    // Top edge to other's bottom
    delta = Math.abs(currentBox.top - (otherBox.bottom + spacing));
    if (delta < SNAP_THRESHOLD_MM && delta < yDelta) {
      snappedY = otherBox.bottom + spacing;
      yDelta = delta;
    }
  }

  // Check for overlap before snapping
  const finalBox = getBoundingBox({ ...panel, x: snappedX, y: snappedY });
  const isOverlapping = allPanels.some(
    p => p.id !== panel.id && isOverlap(finalBox, getBoundingBox(p))
  );

  if (isOverlapping) return { x: currentX, y: currentY };

  // Clamp to workspace bounds (if you already do this, you can omit)
  snappedX = clamp(snappedX, 0, workspaceSize.width - panel.width);
  snappedY = clamp(snappedY, 0, workspaceSize.height - panel.height);

  return { x: snappedX, y: snappedY };
};

  // Mouse events
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e) => {
      // Workspace (screen) coordinates
      const containerRect = workspaceRef.current.getBoundingClientRect();

      // Get mouse position relative to workspace's top left (in px)
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // Work out panel XY in mm (from screen px, scaled)
      // offset is in px; mouseX - offset gives the *panel's topleft* in px
      let newXmm = (mouseX - offset.current.x) * scale;
      let newYmm = (mouseY - offset.current.y) * scale;

      // Clamp to bounds (preliminary, will do again after snapping)
      newXmm = clamp(newXmm, 0, workspaceSize.width - panel.width);
      newYmm = clamp(newYmm, 0, workspaceSize.height - panel.height);

      // Snap (in mm units)
      const snapped = snapToNearbyPanels(newXmm, newYmm);

      updatePosition(panel.id, snapped.x, snapped.y);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging, allPanels, panel.width, panel.height, workspaceSize.width, workspaceSize.height, spacing, scale]);

  const onMouseDown = (e) => {
    const panelRect = ref.current.getBoundingClientRect();
    // Remember offset from panel's top left corner to mouse, in px
    offset.current = {
      x: (e.clientX - panelRect.left),
      y: (e.clientY - panelRect.top)
    };
    setDragging(true);
    e.stopPropagation();
    e.preventDefault();
  };

  // On double click: Rotate and, if required, move if now out of bounds
  const onDoubleClick = () => {
    // After rotate, check if panel fits. If not, pull into workspace
    rotatePanel(panel.id);

    setTimeout(() => {
      // After DOM update, fix position if needed (on next render).
      let { width, height, x, y } = panel;
      // Recompute possible overflow
      if (x + width > workspaceSize.width) x = workspaceSize.width - width;
      if (y + height > workspaceSize.height) y = workspaceSize.height - height;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      updatePosition(panel.id, x, y);
    }, 0);
  };

  return (
  <div
    ref={ref}
    onMouseDown={onMouseDown}
    onDoubleClick={onDoubleClick}
    style={{
      position: 'absolute',
      left: panel.x / scale,
      top: panel.y / scale,
      width: panel.width / scale,
      height: panel.height / scale,
      backgroundColor: (anyOverlap || outOfBounds) 
      ? '#f44336' // red if overlapping or out
      : (dragging ? '#219ebc' : '#8ecae6'),
      border: '2px solid #023047',
      boxSizing: 'border-box',
      cursor: 'move',
      userSelect: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'black',
      fontWeight: 'bold',
      transition: dragging ? 'none' : 'background 0.15s',
      overflow: "hidden"
    }}
    title="Double click to rotate"
  >
    <button
      style={{
        position: 'absolute',
        top: 2,
        right: 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: 'none',
        background: '#f44336',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 10,
        padding: 0,
        lineHeight: '20px',
        textAlign: 'center'
      }}
      onMouseDown={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
        deletePanel(panel.id);
      }}
      title="Delete panel"
    >
      ×
    </button>
    {/* Width on top center, small */}
    <div
      style={{
        position: 'absolute',
        top: 2,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: "0.7em",
        opacity: 0.8,
        pointerEvents: "none",
        fontWeight: "bold",
      }}
    >
      {panel.width}
    </div>

    {/* Height on left center, rotated, small */}
    <div
      style={{
        position: 'absolute',
        left: 2,
        top: "50%",
        transform: "translateY(-50%) rotate(-90deg)",
        fontSize: "0.7em",
        opacity: 10,
        pointerEvents: "none",
        fontWeight: "bold",
        whiteSpace: "nowrap"
      }}
    >
      {panel.height}
    </div>


    {/* Panel name in the center */}
    <div
      style={{
        textAlign: 'center',
        fontSize: panelFontSize,
        fontWeight: "bold",
        pointerEvents: "none",
        zIndex: 1,
        transform: panel.width >= panel.height ? 'none' : 'rotate(-90deg)',
        whiteSpace: 'nowrap'
      }}
    >
      {panel.name || panel.id}
    </div>
  </div>
);
};

export default WorkspacePanelArranger;
