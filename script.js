const teamsData = [
    { name: 'Alemanha', code: 'de' }, { name: 'Paraguai', code: 'py' },
    { name: 'França', code: 'fr' }, { name: 'Suécia', code: 'se' },
    { name: 'África do Sul', code: 'za' }, { name: 'Canadá', code: 'ca' },
    { name: 'Holanda', code: 'nl' }, { name: 'Marrocos', code: 'ma' },
    { name: 'Portugal', code: 'pt' }, { name: 'Croácia', code: 'hr' },
    { name: 'Espanha', code: 'es' }, { name: 'Áustria', code: 'at' },
    { name: 'EUA', code: 'us' }, { name: 'Bósnia', code: 'ba' },
    { name: 'Bélgica', code: 'be' }, { name: 'Senegal', code: 'sn' },
    { name: 'Brasil', code: 'br' }, { name: 'Japão', code: 'jp' },
    { name: 'Costa do Marfim', code: 'ci' }, { name: 'Noruega', code: 'no' },
    { name: 'México', code: 'mx' }, { name: 'Equador', code: 'ec' },
    { name: 'Inglaterra', code: 'gb-eng' }, { name: 'RD Congo', code: 'cd' },
    { name: 'Argentina', code: 'ar' }, { name: 'Cabo Verde', code: 'cv' },
    { name: 'Austrália', code: 'au' }, { name: 'Egito', code: 'eg' },
    { name: 'Suíça', code: 'ch' }, { name: 'Argélia', code: 'dz' },
    { name: 'Colômbia', code: 'co' }, { name: 'Gana', code: 'gh' }
];

const SVG_NS = "http://www.w3.org/2000/svg";
const RADIUS = [0, 90, 170, 250, 330, 420]; 

let tree = [];
let teamElements = {}; // teamName -> SVGImageElement
let activeLevels = {}; // teamName -> currentLevel (5 to 0)
let activeIndices = {}; // teamName -> currentIndex

function initTree() {
    tree = [];
    for (let l = 0; l <= 5; l++) {
        let nodes = [];
        let numNodes = Math.pow(2, l);
        for (let i = 0; i < numNodes; i++) {
            nodes.push({
                team: (l === 5) ? teamsData[i].name : null,
                loser: false
            });
        }
        tree.push(nodes);
    }
    
    // Reset state maps
    teamElements = {};
    activeLevels = {};
    activeIndices = {};
    teamsData.forEach((t, i) => {
        activeLevels[t.name] = 5;
        activeIndices[t.name] = i;
    });
}

function getAngle(level, index) {
    if (level === 5) {
        return (index * 360) / 32;
    }
    const child1Angle = getAngle(level + 1, index * 2);
    const child2Angle = getAngle(level + 1, index * 2 + 1);
    return (child1Angle + child2Angle) / 2;
}

function polarToCartesian(r, degrees) {
    const radians = (degrees - 90) * Math.PI / 180.0;
    return {
        x: r * Math.cos(radians),
        y: r * Math.sin(radians)
    };
}

// Dates based on ESPN data
const espnDates = [
    "30 JUN 18:00", "02 JUL 20:00", "02 JUL 16:00", "01 JUL 21:00",
    "01 JUL 17:00", "30 JUN 14:00", "30 JUN 22:00", "01 JUL 13:00",
    "03 JUL 19:00", "03 JUL 15:00", "03 JUL 00:00", "03 JUL 22:30",
    "04 JUL 18:00", "04 JUL 14:00", "05 JUL 17:00", "05 JUL 21:00"
];

function getMatchDate(level, parentIndex) {
    if (level === 5) return espnDates[parentIndex] || "A DEFINIR";
    
    if (level === 4) {
        const day = 4 + Math.floor(parentIndex / 2);
        const time = parentIndex % 2 === 0 ? "16:00" : "20:00";
        return `${day.toString().padStart(2, '0')} JUL ${time}`;
    }
    
    if (level === 3) {
        const day = 9 + Math.floor(parentIndex / 2);
        const time = parentIndex % 2 === 0 ? "17:00" : "21:00";
        return `${day.toString().padStart(2, '0')} JUL ${time}`;
    }
    
    if (level === 2) {
        const day = 14 + parentIndex;
        return `${day.toString().padStart(2, '0')} JUL 16:00`;
    }
    
    if (level === 1) return `19 JUL 16:00`;
    
    return "";
}

function buildBracket() {
    const container = document.getElementById('bracket-container');
    const oldSvg = document.getElementById('bracket-svg');
    if (oldSvg) oldSvg.remove();

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('id', 'bracket-svg');
    svg.setAttribute('viewBox', '-500 -500 1000 1000');
    
    // Add clip path for circular flags
    const defs = document.createElementNS(SVG_NS, 'defs');
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', 'circle-clip');
    const clipCircle = document.createElementNS(SVG_NS, 'circle');
    clipCircle.setAttribute('cx', '0');
    clipCircle.setAttribute('cy', '0');
    clipCircle.setAttribute('r', '26'); // radius 26 since width is 52
    clipPath.appendChild(clipCircle);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    let glow = document.getElementById('winner-bg-glow');
    if (!glow) {
        glow = document.createElement('div');
        glow.className = 'winner-bg-glow';
        glow.id = 'winner-bg-glow';
        container.appendChild(glow);
    }

    const pathsGroup = document.createElementNS(SVG_NS, 'g');
    pathsGroup.id = 'paths-group';
    svg.appendChild(pathsGroup);

    const nodesGroup = document.createElementNS(SVG_NS, 'g');
    nodesGroup.id = 'nodes-group';
    svg.appendChild(nodesGroup);

    const flagsGroup = document.createElementNS(SVG_NS, 'g');
    flagsGroup.id = 'flags-group';
    svg.appendChild(flagsGroup);

    // Draw straight lines and node dots
    for (let l = 5; l > 0; l--) {
        const numTeams = Math.pow(2, l);
        for (let i = 0; i < numTeams; i++) {
            const parentIndex = Math.floor(i / 2);
            
            const rChild = RADIUS[l];
            const rParent = RADIUS[l - 1];
            const angleChild = getAngle(l, i);
            const angleParent = getAngle(l - 1, parentIndex);

            const pChild = polarToCartesian(rChild, angleChild);
            const pInter = polarToCartesian(rParent, angleChild);
            const pParent = polarToCartesian(rParent, angleParent);

            // Draw geometric bracket path
            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', `M ${pChild.x} ${pChild.y} L ${pInter.x} ${pInter.y} L ${pParent.x} ${pParent.y}`);
            path.setAttribute('class', 'bracket-path');
            path.setAttribute('fill', 'none');
            path.id = `line-${l}-${i}`;
            pathsGroup.appendChild(path);

            // Match Date/Time Badge
            if (i % 2 === 0 && rParent > 0) {
                const rBadge = rParent + 12;
                const pBadge = polarToCartesian(rBadge, angleParent);
                
                const text = document.createElementNS(SVG_NS, 'text');
                text.setAttribute('x', pBadge.x);
                text.setAttribute('y', pBadge.y);
                text.setAttribute('class', 'match-time');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('alignment-baseline', 'middle');
                
                let rot = angleParent;
                if (rot > 90 && rot < 270) rot += 180;
                text.setAttribute('transform', `rotate(${rot}, ${pBadge.x}, ${pBadge.y})`);
                
                text.textContent = getMatchDate(l, parentIndex);
                pathsGroup.appendChild(text);
            }

            // Dot at parent (only draw once per parent, so when i is even)
            if (i % 2 === 0 && l > 1) {
                const circle = document.createElementNS(SVG_NS, 'circle');
                circle.setAttribute('cx', pParent.x);
                circle.setAttribute('cy', pParent.y);
                circle.setAttribute('r', 4);
                circle.setAttribute('class', 'bracket-node');
                nodesGroup.appendChild(circle);
            }
        }
    }

    // Draw Flag Images
    teamsData.forEach((teamInfo, i) => {
        const p = polarToCartesian(RADIUS[5], getAngle(5, i));
        
        const img = document.createElementNS(SVG_NS, 'image');
        img.setAttribute('href', `https://flagcdn.com/w80/${teamInfo.code}.png`); // get a slightly larger image from flagcdn for better resolution
        img.setAttribute('width', 52);
        img.setAttribute('height', 52);
        img.setAttribute('x', -26); // Center image
        img.setAttribute('y', -26);
        img.setAttribute('preserveAspectRatio', 'xMidYMid slice'); // Ensure it covers the circle without blank spaces
        img.setAttribute('class', 'team-flag');
        img.setAttribute('clip-path', 'url(#circle-clip)');
        img.id = `flag-${teamInfo.code}`;
        img.setAttribute('data-name', teamInfo.name);

        // Set position via CSS transform for animation
        img.style.transform = `translate(${p.x}px, ${p.y}px)`;
        
        img.addEventListener('click', () => advanceTeam(teamInfo.name));
        
        flagsGroup.appendChild(img);
        teamElements[teamInfo.name] = img;
    });

    container.appendChild(svg);
}

function advanceTeam(teamName) {
    const level = activeLevels[teamName];
    const index = activeIndices[teamName];

    if (level === 0) return; // Already winner

    const parentLevel = level - 1;
    const parentIndex = Math.floor(index / 2);
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    const siblingNode = tree[level][siblingIndex];

    // Propagate the win in the tree
    tree[parentLevel][parentIndex].team = teamName;
    
    // Animate along the geometric path (radial first, then chord)
    const img = teamElements[teamName];
    const angleChild = getAngle(level, index);
    const pInter = polarToCartesian(RADIUS[parentLevel], angleChild);
    const pParent = polarToCartesian(RADIUS[parentLevel], getAngle(parentLevel, parentIndex));
    
    if (img.moveTimeout1) clearTimeout(img.moveTimeout1);
    if (img.moveTimeout2) clearTimeout(img.moveTimeout2);

    img.style.transition = 'transform 0.25s linear, filter 0.4s ease, opacity 0.4s ease';
    img.style.transform = `translate(${pInter.x}px, ${pInter.y}px)`;
    
    img.moveTimeout1 = setTimeout(() => {
        img.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s ease, opacity 0.4s ease';
        img.style.transform = `translate(${pParent.x}px, ${pParent.y}px)`;
        
        img.moveTimeout2 = setTimeout(() => {
            img.style.transition = ''; 
        }, 250);
    }, 250);
    
    // Update internal state
    activeLevels[teamName] = parentLevel;
    activeIndices[teamName] = parentIndex;

    function colorPath(level, index) {
        const path = document.getElementById(`line-${level}-${index}`);
        if (path) {
            path.classList.add('active');
        }
    }
    colorPath(level, index);

    // Eliminate Sibling
    if (siblingNode.team) {
        siblingNode.loser = true;
        const siblingImg = teamElements[siblingNode.team];
        if (siblingImg) siblingImg.classList.add('loser');
        
        const loserPath = document.getElementById(`line-${level}-${siblingIndex}`);
        if (loserPath) {
            loserPath.classList.add('loser');
            loserPath.classList.remove('active');
        }
    }

    if (parentLevel === 0) {
        decideWinner(teamName);
    } else {
        clearWinner();
    }
}

function decideWinner(teamName) {
    const container = document.getElementById('trophy-container');
    const winnerText = document.getElementById('winner-name');
    const glow = document.getElementById('winner-bg-glow');
    
    winnerText.textContent = teamName;
    container.classList.add('decided');
    glow.classList.add('active');
}

function clearWinner() {
    const container = document.getElementById('trophy-container');
    const glow = document.getElementById('winner-bg-glow');
    container.classList.remove('decided');
    glow.classList.remove('active');
}

document.getElementById('reset-btn').addEventListener('click', () => {
    initTree();
    clearWinner();
    buildBracket();
});

// Initialize
initTree();
buildBracket();

// Tooltip Logic
const tooltip = document.getElementById('tooltip');

document.addEventListener('mouseover', (e) => {
    if (e.target.classList && e.target.classList.contains('team-flag') && !e.target.classList.contains('loser')) {
        tooltip.textContent = e.target.getAttribute('data-name');
        tooltip.classList.add('visible');
    }
});

document.addEventListener('mousemove', (e) => {
    if (tooltip.classList.contains('visible')) {
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY - 35}px`;
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList && e.target.classList.contains('team-flag')) {
        tooltip.classList.remove('visible');
    }
});
