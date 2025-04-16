// Global variables
let simulationSubsets = [];
let simulationEdges = [];
let simulationIndex = 0;
let simulationMinCover = null;
let cy = null;

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('runBtn').addEventListener('click', runSimulation);
    document.getElementById('simulateBtn').addEventListener('click', startSimulation);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
});

// Main function to run the algorithm at once
function runSimulation() {
    const vertexCount = parseInt(document.getElementById("vertexCount").value);
    const edgesRaw = document.getElementById("edgesInput").value.trim().split("\n");
    const edges = edgesRaw.map(line => line.trim().split(" ").map(Number));

    // Step 1: Generate all subsets
    const allSubsets = getAllSubsets(vertexCount);

    let minCover = null;

    for (const subset of allSubsets) {
        if (isValidCover(subset, edges)) {
            if (!minCover || subset.length < minCover.length) {
                minCover = subset;
            }
        }
    }

    drawGraph(vertexCount, edges, minCover);

    document.getElementById("result").innerText = minCover ? 
        `Minimum Vertex Cover: [${minCover.join(", ")}]` : 
        "No valid cover found";
}

// Generate all possible subsets of vertices
function getAllSubsets(n) {
    const subsets = [];
    const total = 1 << n; // 2^n

    for (let mask = 0; mask < total; mask++) {
        const subset = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                subset.push(i);
            }
        }
        subsets.push(subset);
    }

    return subsets;
}

// Check if a subset is a valid vertex cover
function isValidCover(subset, edges) {
    const coverSet = new Set(subset);
    for (const [u, v] of edges) {
        if (!coverSet.has(u) && !coverSet.has(v)) {
            return false;
        }
    }
    return true;
}

// Draw the graph using Cytoscape.js
function drawGraph(vertexCount, edges, highlight = []) {
    if (cy !== null) {
        cy.destroy();
        document.getElementById("cy").innerHTML = "";
    }

    const elements = [];
    const highlightSet = new Set(highlight.map(String));

    // Add nodes
    for (let i = 0; i < vertexCount; i++) {
        elements.push({
            data: { id: String(i) },
            classes: highlightSet.has(String(i)) ? "highlight" : ""
        });
    }

    // Add edges
    for (const [u, v] of edges) {
        elements.push({
            data: { id: `${u}-${v}`, source: String(u), target: String(v) }
        });
    }

    // Initialize Cytoscape
    cy = cytoscape({
        container: document.getElementById("cy"),
        elements: elements,
        style: [
            {
                selector: "node",
                style: {
                    "background-color": "#666",
                    label: "data(id)",
                    "text-valign": "center",
                    "color": "#fff",
                    "text-outline-color": "#666",
                    "text-outline-width": 1
                }
            },
            {
                selector: "edge",
                style: {
                    "width": 2,
                    "line-color": "#ccc"
                }
            },
            {
                selector: ".highlight",
                style: {
                    "background-color": "#e74c3c",
                    "border-width": 3,
                    "border-color": "#222"
                }
            }
        ],
        layout: {
            name: "cose",
            animate: true
        },
        wheelSensitivity: 0.2,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true
    });

    // Resize and fit after a short delay
    setTimeout(() => {
        cy.resize();
        cy.fit(cy.elements(), 30);
        cy.center();
        cy.zoom(1);
    }, 100);
}

// Start the step-by-step simulation
function startSimulation() {
    const vertexCount = parseInt(document.getElementById("vertexCount").value);
    const edgesRaw = document.getElementById("edgesInput").value.trim().split("\n");
    simulationEdges = edgesRaw.map(line => line.trim().split(" ").map(Number));
    simulationSubsets = getAllSubsets(vertexCount);
    simulationIndex = 0;
    simulationMinCover = null;

    document.getElementById("nextBtn").disabled = false;
    document.getElementById("simOutput").innerText = "Simulation started...\nClick 'Next Step' to proceed.";
    drawGraph(vertexCount, simulationEdges, []); // Draw clean graph
}

// Process the next step in the simulation
function nextStep() {
    if (simulationIndex >= simulationSubsets.length) {
        document.getElementById("simOutput").innerText += `\n✅ Simulation complete. Minimum Vertex Cover: [${simulationMinCover.join(", ")}]`;
        document.getElementById("nextBtn").disabled = true;

        const vertexCount = parseInt(document.getElementById("vertexCount").value);
        drawGraph(vertexCount, simulationEdges, simulationMinCover);
        return;
    }

    const subset = simulationSubsets[simulationIndex];
    const isValid = isValidCover(subset, simulationEdges);

    let output = `Step ${simulationIndex + 1}:\nTrying subset: [${subset.join(", ")}] — ${isValid ? "✅ Valid" : "❌ Invalid"}`;

    if (isValid) {
        if (!simulationMinCover || subset.length < simulationMinCover.length) {
            simulationMinCover = [...subset];
            output += "\n→ New minimum cover found!";
        }
    }

    drawGraph(parseInt(document.getElementById("vertexCount").value), simulationEdges, subset);
    document.getElementById("simOutput").innerText = output;
    simulationIndex++;
}