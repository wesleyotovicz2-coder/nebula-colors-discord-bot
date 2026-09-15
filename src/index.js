import "dotenv/config";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BOT_NAME = "FUNKAI Color Bot";
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const MAX_COLORS_PER_CATEGORY = 25;
const COLORS_PER_BUTTON_PAGE = 10;
const dataFile = path.resolve(process.env.DATA_FILE || "./data/guilds.json");

const defaultCategories = [
  {
    // Ordem cromática: vermelho → laranja → amarelo → verde → ciano → azul → índigo → violeta → roxo → fúcsia → rosa
    id: "basicas",
    name: "Básicas",
    colors: [
      { id: "vermelho",     name: "Vermelho",    hex: "#EF4444", roleId: null }, //   0°
      { id: "coral",        name: "Coral",        hex: "#F87171", roleId: null }, //   3°
      { id: "laranja-claro",name: "Laranja claro",hex: "#FB923C", roleId: null }, //  24°
      { id: "ambar",        name: "Âmbar",        hex: "#F59E0B", roleId: null }, //  40°
      { id: "amarelo",      name: "Amarelo",      hex: "#EAB308", roleId: null }, //  50°
      { id: "lima",         name: "Lima",         hex: "#84CC16", roleId: null }, //  85°
      { id: "verde",        name: "Verde",        hex: "#22C55E", roleId: null }, // 142°
      { id: "esmeralda",    name: "Esmeralda",    hex: "#10B981", roleId: null }, // 160°
      { id: "teal",         name: "Teal",         hex: "#14B8A6", roleId: null }, // 174°
      { id: "ciano",        name: "Ciano",        hex: "#06B6D4", roleId: null }, // 189°
      { id: "azul-ceu",     name: "Azul céu",     hex: "#38BDF8", roleId: null }, // 200°
      { id: "azul",         name: "Azul",         hex: "#3B82F6", roleId: null }, // 219°
      { id: "indigo",       name: "Índigo",       hex: "#6366F1", roleId: null }, // 239°
      { id: "violeta",      name: "Violeta",      hex: "#8B5CF6", roleId: null }, // 263°
      { id: "roxo-basico",  name: "Roxo",         hex: "#A855F7", roleId: null }, // 280°
      { id: "fucsia",       name: "Fúcsia",       hex: "#D946EF", roleId: null }, // 293°
      { id: "rosa",         name: "Rosa",         hex: "#EC4899", roleId: null }, // 328°
    ],
  },
  {
    // Ordem cromática: vermelho-vivo → laranja → ouro → verde → azul → violeta → uva → roxo → magenta
    id: "vibrantes",
    name: "Vibrantes",
    colors: [
      { id: "vermelho-vivo",  name: "Vermelho vivo",  hex: "#DC2626", roleId: null }, //   0°
      { id: "tomate",         name: "Tomate",         hex: "#C0392B", roleId: null }, //   5°
      { id: "laranja-escuro", name: "Laranja escuro", hex: "#EA580C", roleId: null }, //  20°
      { id: "laranja",        name: "Laranja",        hex: "#F97316", roleId: null }, //  25°
      { id: "ouro-vivo",      name: "Ouro vivo",      hex: "#D97706", roleId: null }, //  38°
      { id: "chartreuse",     name: "Chartreuse",     hex: "#65A30D", roleId: null }, //  83°
      { id: "verde-vivo",     name: "Verde vivo",     hex: "#16A34A", roleId: null }, // 142°
      { id: "verde-mar",      name: "Verde-mar",      hex: "#0D9488", roleId: null }, // 175°
      { id: "azul-petroleo",  name: "Azul petróleo",  hex: "#0891B2", roleId: null }, // 191°
      { id: "azul-royal",     name: "Azul royal",     hex: "#2563EB", roleId: null }, // 221°
      { id: "azul-cobalto",   name: "Azul cobalto",   hex: "#1D4ED8", roleId: null }, // 224°
      { id: "violeta-vivo",   name: "Violeta vivo",   hex: "#7C3AED", roleId: null }, // 262°
      { id: "uva",            name: "Uva",            hex: "#6D28D9", roleId: null }, // 263°
      { id: "roxo",           name: "Roxo",           hex: "#9333EA", roleId: null }, // 271°
      { id: "magenta",        name: "Magenta",        hex: "#DB2777", roleId: null }, // 328°
      { id: "rosa-choque",    name: "Rosa choque",    hex: "#BE185D", roleId: null }, // 335°
    ],
  },
  {
    // Ordem cromática: pêssego → salmão → mel → verde → menta → água → azul-bebê → lilás → lavanda → rosa
    id: "pasteis",
    name: "Pastéis",
    colors: [
      { id: "pessego",      name: "Pêssego",      hex: "#FCA5A5", roleId: null }, //   0°
      { id: "salmao",       name: "Salmão",       hex: "#FED7AA", roleId: null }, //  32°
      { id: "mel",          name: "Mel",          hex: "#FEF08A", roleId: null }, //  53°
      { id: "verde-pastel", name: "Verde pastel", hex: "#BBF7D0", roleId: null }, // 141°
      { id: "menta",        name: "Menta",        hex: "#A7F3D0", roleId: null }, // 152°
      { id: "agua",         name: "Água",         hex: "#BAE6FD", roleId: null }, // 201°
      { id: "azul-bebe",    name: "Azul bebê",    hex: "#BFDBFE", roleId: null }, // 213°
      { id: "lilas",        name: "Lilás",        hex: "#DDD6FE", roleId: null }, // 251°
      { id: "lavanda",      name: "Lavanda",      hex: "#C4B5FD", roleId: null }, // 253°
      { id: "rosa-chiclete",name: "Rosa chiclete",hex: "#FBCFE8", roleId: null }, // 326°
      { id: "rosa-pastel",  name: "Rosa pastel",  hex: "#F9A8D4", roleId: null }, // 327°
      { id: "perola",       name: "Pérola",       hex: "#F1F5F9", roleId: null }, // neutro
    ],
  },
  {
    // Ordem cromática: vermelho → laranja → amarelo → lima → verde → aqua → ciano → elétrico → azul → roxo → magenta → pink
    id: "neon",
    name: "Neon",
    colors: [
      { id: "neon-vermelho",  name: "Neon vermelho",  hex: "#FF2D55", roleId: null }, // 349°
      { id: "neon-laranja",   name: "Neon laranja",   hex: "#FF6B00", roleId: null }, //  25°
      { id: "neon-amarelo",   name: "Neon amarelo",   hex: "#FFE600", roleId: null }, //  54°
      { id: "neon-lima",      name: "Neon lima",      hex: "#A3E635", roleId: null }, //  83°
      { id: "neon-verde",     name: "Neon verde",     hex: "#00FF87", roleId: null }, // 152°
      { id: "neon-aqua",      name: "Neon aqua",      hex: "#00FFDD", roleId: null }, // 172°
      { id: "neon-ciano",     name: "Neon ciano",     hex: "#22D3EE", roleId: null }, // 188°
      { id: "neon-eletrico",  name: "Neon elétrico",  hex: "#00B4FF", roleId: null }, // 198°
      { id: "neon-azul",      name: "Neon azul",      hex: "#3F8EFC", roleId: null }, // 215°
      { id: "neon-roxo",      name: "Neon roxo",      hex: "#BF5FFF", roleId: null }, // 276°
      { id: "neon-magenta",   name: "Neon magenta",   hex: "#FF00FF", roleId: null }, // 300°
      { id: "neon-pink",      name: "Neon pink",      hex: "#F472B6", roleId: null }, // 329°
    ],
  },
  {
    // Ordem cromática: vinho → marrom → caramelo → oliva → floresta → jade → abissal → grafite → marinho → índigo → roxo → ameixa → bordô
    id: "escuras",
    name: "Escuras",
    colors: [
      { id: "vinho",        name: "Vinho",        hex: "#7F1D1D", roleId: null }, //   0°
      { id: "marrom",       name: "Marrom",       hex: "#7C2D12", roleId: null }, //  15°
      { id: "caramelo",     name: "Caramelo",     hex: "#78350F", roleId: null }, //  22°
      { id: "oliva",        name: "Oliva",        hex: "#365314", roleId: null }, //  88°
      { id: "floresta",     name: "Floresta",     hex: "#14532D", roleId: null }, // 144°
      { id: "jade",         name: "Jade",         hex: "#134E4A", roleId: null }, // 176°
      { id: "azul-abissal", name: "Azul abissal", hex: "#164E63", roleId: null }, // 196°
      { id: "grafite",      name: "Grafite",      hex: "#374151", roleId: null }, // 217°
      { id: "marinho",      name: "Marinho",      hex: "#1E3A8A", roleId: null }, // 224°
      { id: "indigo-escuro",name: "Índigo escuro",hex: "#312E81", roleId: null }, // 242°
      { id: "roxo-escuro",  name: "Roxo escuro",  hex: "#4C1D95", roleId: null }, // 264°
      { id: "ameixa",       name: "Ameixa",       hex: "#581C87", roleId: null }, // 274°
      { id: "bordo",        name: "Bordô",        hex: "#831843", roleId: null }, // 336°
    ],
  },
  {
    // Metálicos: tons quentes (dourado → champanhe → bronze → cobre → âmbar) → rosé → frios (prata → platina)
    id: "especiais",
    name: "Especiais",
    colors: [
      { id: "dourado",     name: "Dourado",     hex: "#FFD700", roleId: null },
      { id: "champanhe",   name: "Champanhe",   hex: "#FBBF24", roleId: null },
      { id: "ambar-escuro",name: "Âmbar escuro",hex: "#B45309", roleId: null },
      { id: "bronze",      name: "Bronze",      hex: "#A16207", roleId: null },
      { id: "cobre",       name: "Cobre",       hex: "#C2763C", roleId: null },
      { id: "rose-gold",   name: "Rosé gold",   hex: "#FDA4AF", roleId: null },
      { id: "prata",       name: "Prata",       hex: "#CBD5E1", roleId: null },
      { id: "platina",     name: "Platina",     hex: "#E2E8F0", roleId: null },
    ],
  },
];

const commands = [
  new SlashCommandBuilder()
    .setName("painel-menus")
    .setDescription("Cria ou atualiza o painel de cores com menus"),
  new SlashCommandBuilder()
    .setName("painel-botoes")
    .setDescription("Cria ou atualiza o painel com imagens e botões"),
  new SlashCommandBuilder()
    .setName("cores")
    .setDescription("Gerencia categorias, cores e cargos")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .addSubcommand((sub) =>
      sub
        .setName("adicionar")
        .setDescription("Adiciona várias cores de uma vez")
        .addStringOption((opt) => opt.setName("categoria").setDescription("ID da categoria").setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName("lista")
            .setDescription("Ex.: Vermelho=#FF0000; Azul=rgb(0,0,255)")
            .setRequired(true)
            .setMaxLength(6000),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("editar")
        .setDescription("Edita uma cor e seu cargo")
        .addStringOption((opt) => opt.setName("cor").setDescription("ID da cor").setRequired(true))
        .addStringOption((opt) => opt.setName("nome").setDescription("Novo nome").setRequired(true))
        .addStringOption((opt) => opt.setName("valor").setDescription("Hex ou RGB, ex.: #FF00AA ou rgb(255,0,170)").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remover")
        .setDescription("Pede confirmação antes de remover uma cor")
        .addStringOption((opt) => opt.setName("cor").setDescription("ID da cor").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("categoria-criar")
        .setDescription("Cria uma categoria")
        .addStringOption((opt) => opt.setName("nome").setDescription("Nome da categoria").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("categoria-editar")
        .setDescription("Edita uma categoria")
        .addStringOption((opt) => opt.setName("categoria").setDescription("ID da categoria").setRequired(true))
        .addStringOption((opt) => opt.setName("nome").setDescription("Novo nome").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("categoria-remover")
        .setDescription("Remove uma categoria sem apagar cargos")
        .addStringOption((opt) => opt.setName("categoria").setDescription("ID da categoria").setRequired(true)),
    ),
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let guildsData = {};

const cloneDefaults = () => structuredClone(defaultCategories);
const hexToNumber = (hex) => Number.parseInt(hex.slice(1), 16);
const errorText = (error) => (error instanceof Error ? error.message : "erro desconhecido");
const normalizeId = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

function parseColorValue(value) {
  const input = value.trim().toUpperCase();
  if (HEX_PATTERN.test(input)) return input;
  const match = input.match(/^RGB?\(\s*(\d{1,3})\s*[,;]\s*(\d{1,3})\s*[,;]\s*(\d{1,3})\s*\)$/i)
    || input.match(/^(\d{1,3})\s*[,;]\s*(\d{1,3})\s*[,;]\s*(\d{1,3})$/);
  if (!match) return null;
  const channels = match.slice(1).map(Number);
  if (channels.some((channel) => channel < 0 || channel > 255)) return null;
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function parseColorList(input) {
  const entries = input.replaceAll("\r", "").split(/\s*;\s*|\n+/).map((entry) => entry.trim()).filter(Boolean);
  const result = [];
  for (const entry of entries) {
    const hexes = entry.match(/#[0-9a-f]{6}/gi) || [];
    const remainder = entry.replace(/#[0-9a-f]{6}/gi, "").replace(/[,\s]+/g, "");
    if (hexes.length > 1 && !remainder) {
      for (const hex of hexes) result.push({ name: `Cor ${result.length + 1}`, hex: hex.toUpperCase() });
      continue;
    }

    const separator = entry.search(/\s*[=:]\s*/);
    const rawName = separator >= 0 ? entry.slice(0, separator).trim() : "";
    const rawValue = separator >= 0 ? entry.slice(separator).replace(/^\s*[=:]\s*/, "").trim() : entry;
    const hex = parseColorValue(rawValue);
    if (!hex) throw new Error(`valor inválido em "${entry}". Use #RRGGBB ou rgb(0,0,0).`);
    result.push({ name: (rawName || `Cor ${result.length + 1}`).slice(0, 40), hex });
  }
  if (!result.length) throw new Error("nenhuma cor foi encontrada na lista.");
  return result;
}

async function loadData() {
  await mkdir(path.dirname(dataFile), { recursive: true });
  try {
    guildsData = JSON.parse(await readFile(dataFile, "utf8"));
  } catch {
    guildsData = {};
    await saveData();
  }
}

async function saveData() {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(guildsData, null, 2)}\n`, "utf8");
}

function getConfig(guildId) {
  if (!guildsData[guildId]) {
    guildsData[guildId] = {
      categories: [],
      panelChannelId: null,
      panelMessageId: null,
      panelImageMessageIds: [],
      panelMode: "menus",
    };
  }
  if (!guildsData[guildId].panelMode) guildsData[guildId].panelMode = "menus";
  if (!Array.isArray(guildsData[guildId].panelImageMessageIds)) guildsData[guildId].panelImageMessageIds = [];
  return guildsData[guildId];
}

function getColor(categories, colorId) {
  for (const category of categories) {
    const color = category.colors.find((item) => item.id === colorId);
    if (color) return { category, color };
  }
  return null;
}

function panelEmbed(categories, mode = "menus") {
  const colorCount = categories.reduce((total, category) => total + category.colors.length, 0);
  const isButtonMode = mode === "botoes";
  return new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle("FUNKAI • Cores do perfil")
    .setDescription(
      isButtonMode
        ? "As imagens abaixo mostram todas as cores em grupos de 10. Clique no número correspondente à cor desejada."
        : "Escolha uma categoria abaixo e depois selecione uma cor. Cada pessoa pode ter uma cor ativa por vez.",
    )
    .addFields(
      { name: "Categorias", value: categories.map((category) => `\`${category.id}\`  ${category.name}`).join("\n") || "Nenhuma categoria criada." },
      { name: "Disponíveis", value: `${colorCount} cores`, inline: true },
      { name: "Modo", value: isButtonMode ? "Botões + imagem" : "Menus", inline: true },
    )
    .setFooter({ text: "FUNKAI Color Bot • personalização de perfil" });
}

function panelComponents(categories, mode = "menus") {
  if (mode === "botoes") {
    return [];
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId("funkai_category_select")
    .setPlaceholder("Escolha uma categoria")
    .setDisabled(categories.length === 0)
    .addOptions(
      categories.slice(0, 25).map((category) => ({
        label: category.name.slice(0, 100),
        value: category.id,
        description: `${category.colors.length} cor${category.colors.length === 1 ? "" : "es"}`,
      })),
    );
  return [new ActionRowBuilder().addComponents(menu)];
}

function allColors(categories) {
  return categories.flatMap((category) => category.colors);
}

function buttonPanelCategory(categories) {
  return { id: "todas", name: "Todas as cores", colors: allColors(categories) };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function readableTextColor(hex) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) >= 150000 ? "#111827" : "#FFFFFF";
}

function colorPage(category, requestedPage = 0) {
  const totalPages = Math.max(1, Math.ceil(category.colors.length / COLORS_PER_BUTTON_PAGE));
  const page = Math.max(0, Math.min(Number(requestedPage) || 0, totalPages - 1));
  return {
    page,
    totalPages,
    colors: category.colors.slice(page * COLORS_PER_BUTTON_PAGE, (page + 1) * COLORS_PER_BUTTON_PAGE),
  };
}

function colorPanelSvg(category, page, totalPages, colors) {
  const cards = colors.map((color, index) => {
    const x = 40 + (index % 5) * 188;
    const y = 116 + Math.floor(index / 5) * 132;
    const textColor = readableTextColor(color.hex);
    const title = `${index + 1} ${color.name}`;
    return `
      <g>
        <rect x="${x}" y="${y}" width="168" height="102" rx="16" fill="#F8FAFC" stroke="${escapeXml(color.hex)}" stroke-width="2"/>
        <path d="M ${x + 2} ${y + 18} Q ${x + 2} ${y + 2} ${x + 18} ${y + 2} H ${x + 150} Q ${x + 166} ${y + 2} ${x + 166} ${y + 18} V ${y + 38} H ${x + 2} Z" fill="${escapeXml(color.hex)}"/>
        <circle cx="${x + 18}" cy="${y + 20}" r="7" fill="${textColor}" opacity="0.9"/>
        <text x="${x + 91}" y="${y + 25}" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-size="13" font-weight="700" textLength="122" lengthAdjust="spacingAndGlyphs">${escapeXml(title)}</text>
        <text x="${x + 16}" y="${y + 64}" fill="${escapeXml(color.hex)}" stroke="#FFFFFF" stroke-width="2" paint-order="stroke" font-family="Arial, sans-serif" font-size="14" font-weight="700" textLength="136" lengthAdjust="spacingAndGlyphs">${escapeXml(color.name)}</text>
        <text x="${x + 16}" y="${y + 86}" fill="#475569" font-family="Arial, sans-serif" font-size="12">${escapeXml(color.hex)}</text>
      </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="410" viewBox="0 0 980 410">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0B1020"/>
        <stop offset="100%" stop-color="#1E1B4B"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#020617" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="980" height="410" rx="24" fill="url(#background)"/>
    <circle cx="895" cy="20" r="100" fill="#8B5CF6" opacity="0.12"/>
    <circle cx="80" cy="410" r="120" fill="#22D3EE" opacity="0.08"/>
    <text x="40" y="38" fill="#A5B4FC" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2">FUNKAI COLOR LAB</text>
    <text x="40" y="67" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(category.name)}</text>
    <text x="40" y="91" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="14">Clique no número do tom que você quer usar</text>
    <rect x="839" y="29" width="101" height="34" rx="17" fill="#FFFFFF" opacity="0.12"/>
    <text x="889" y="51" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="13" font-weight="700">PÁGINA ${page + 1}/${totalPages}</text>
    <g filter="url(#shadow)">${cards}</g>
  </svg>`;
}

async function colorPanelPayload(category, requestedPage = 0) {
  const { page, totalPages, colors } = colorPage(category, requestedPage);
  const fileName = `funkai-colors-${category.id}-${page}.png`;
  const image = await sharp(Buffer.from(colorPanelSvg(category, page, totalPages, colors))).png().toBuffer();
  const attachment = new AttachmentBuilder(image, { name: fileName });
  const buttons = [];

  for (let index = 0; index < colors.length; index += 5) {
    buttons.push(
      new ActionRowBuilder().addComponents(
        colors.slice(index, index + 5).map((color, offset) =>
          new ButtonBuilder()
            .setCustomId(`funkai_color_button:${category.id}:${color.id}:${page}`)
            .setLabel(String(index + offset + 1))
            .setStyle(ButtonStyle.Secondary),
        ),
      ),
    );
  }

  const embed = new EmbedBuilder()
    .setColor(hexToNumber(colors[0]?.hex || "#8B5CF6"))
    .setTitle(`Cores de ${category.name}`)
    .setDescription("A imagem mostra o número e o nome de cada cor na própria cor. Clique no botão com o mesmo número para receber o cargo.")
    .setImage(`attachment://${fileName}`)
    .setFooter({ text: "Você pode ter uma cor de perfil ativa por vez." });

  return { embeds: [embed], files: [attachment], components: buttons };
}

async function ensureRoles(guild, categories) {
  let changed = false;
  for (const category of categories) {
    for (const color of category.colors) {
      if (color.roleId && guild.roles.cache.has(color.roleId)) continue;
      const role = await guild.roles.create({
        name: `FUNKAI • ${color.name}`,
        colors: { primaryColor: hexToNumber(color.hex) },
        reason: `${BOT_NAME}: cargo de cor`,
      });
      color.roleId = role.id;
      changed = true;
    }
  }
  return changed;
}

async function deleteButtonImages(channel, config) {
  for (const messageId of config.panelImageMessageIds || []) {
    try {
      const message = await channel.messages.fetch(messageId);
      await message.delete();
    } catch {
      // A mensagem pode já ter sido apagada manualmente.
    }
  }
  config.panelImageMessageIds = [];
}

async function publishButtonImages(channel, config) {
  const category = buttonPanelCategory(config.categories);
  const totalPages = Math.max(1, Math.ceil(category.colors.length / COLORS_PER_BUTTON_PAGE));
  const currentIds = config.panelImageMessageIds || [];

  if (currentIds.length === totalPages) {
    for (let page = 0; page < totalPages; page += 1) {
      try {
        const message = await channel.messages.fetch(currentIds[page]);
        await message.edit(await colorPanelPayload(category, page));
      } catch {
        config.panelImageMessageIds = [];
        break;
      }
    }
    if (config.panelImageMessageIds.length === totalPages) return;
  }

  await deleteButtonImages(channel, config);
  for (let page = 0; page < totalPages; page += 1) {
    const message = await channel.send(await colorPanelPayload(category, page));
    config.panelImageMessageIds.push(message.id);
  }
}

async function refreshPanel(guild, config) {
  if (!config.panelChannelId || !config.panelMessageId) return;
  try {
    const channel = await guild.channels.fetch(config.panelChannelId);
    if (!channel?.isTextBased() || !("messages" in channel)) return;
    try {
      const message = await channel.messages.fetch(config.panelMessageId);
      await message.edit({ embeds: [panelEmbed(config.categories, config.panelMode)], components: panelComponents(config.categories, config.panelMode) });
    } catch (error) {
      console.warn(`[painel] mensagem principal indisponível: ${errorText(error)}`);
      const replacement = await channel.send({
        embeds: [panelEmbed(config.categories, config.panelMode)],
        components: panelComponents(config.categories, config.panelMode),
      });
      config.panelMessageId = replacement.id;
      await saveData();
      console.log(`[painel] Mensagem principal recriada: ${replacement.id}`);
    }
    if (config.panelMode === "botoes") await publishButtonImages(channel, config);
  } catch (error) {
    console.warn(`[painel] não foi possível atualizar: ${errorText(error)}`);
  }
}

async function handleSetup(interaction, mode) {
  const channel = interaction.channel;
  if (!interaction.guild || !channel?.isTextBased() || !("send" in channel)) {
    await interaction.reply({ content: "Use este comando em um canal de servidor.", flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const config = getConfig(interaction.guild.id);
  config.panelMode = mode;
  if (!config.categories.length) config.categories = cloneDefaults();
  const rolesChanged = await ensureRoles(interaction.guild, config.categories);
  await deleteButtonImages(channel, config);
  const panel = await channel.send({
    embeds: [panelEmbed(config.categories, config.panelMode)],
    components: panelComponents(config.categories, config.panelMode),
  });
  config.panelChannelId = channel.id;
  config.panelMessageId = panel.id;
  if (config.panelMode === "botoes") await publishButtonImages(channel, config);
  await saveData();
  await interaction.editReply(rolesChanged ? "Painel criado e cargos sincronizados." : "Painel atualizado com sucesso.");
}

async function handleCategory(interaction) {
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  const sub = interaction.options.getSubcommand();
  if (sub === "categoria-criar") {
    const name = interaction.options.getString("nome", true).trim();
    const id = normalizeId(name);
    if (name.length < 2 || name.length > 40 || !id || config.categories.some((item) => item.id === id)) {
      await interaction.reply({ content: "Nome inválido ou categoria já existente.", flags: MessageFlags.Ephemeral });
      return;
    }
    config.categories.push({ id, name, colors: [] });
    await saveData();
    await refreshPanel(interaction.guild, config);
    await interaction.reply({ content: `Categoria **${name}** criada. ID: \`${id}\``, flags: MessageFlags.Ephemeral });
    return;
  }
  const categoryId = interaction.options.getString("categoria", true);
  const category = config.categories.find((item) => item.id === categoryId);
  if (!category) {
    await interaction.reply({ content: "Categoria não encontrada.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (sub === "categoria-editar") {
    category.name = interaction.options.getString("nome", true).trim();
    await saveData();
    await refreshPanel(interaction.guild, config);
    await interaction.reply({ content: `Categoria atualizada para **${category.name}**.`, flags: MessageFlags.Ephemeral });
    return;
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`funkai_confirm_remove_category:${category.id}:${interaction.user.id}`).setLabel("Confirmar").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`funkai_cancel_remove_category:${category.id}:${interaction.user.id}`).setLabel("Cancelar").setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({
    content: `Tem certeza que deseja remover a categoria **${category.name}**? Os cargos do Discord serão mantidos.`,
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleColor(interaction) {
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  const sub = interaction.options.getSubcommand();
  if (sub === "criar") {
    const category = config.categories.find((item) => item.id === interaction.options.getString("categoria", true));
    const name = interaction.options.getString("nome", true).trim();
    const hex = interaction.options.getString("hex", true).trim().toUpperCase();
    const id = normalizeId(name);
    if (!category || !HEX_PATTERN.test(hex) || !id || getColor(config.categories, id) || category.colors.length >= MAX_COLORS_PER_CATEGORY) {
      await interaction.reply({ content: "Categoria, nome ou hexadecimal inválido. Cada categoria aceita até 25 cores.", flags: MessageFlags.Ephemeral });
      return;
    }
    const role = await interaction.guild.roles.create({
      name: `FUNKAI • ${name}`,
      colors: { primaryColor: hexToNumber(hex) },
      reason: `${BOT_NAME}: nova cor`,
    });
    category.colors.push({ id, name, hex, roleId: role.id });
    await saveData();
    await refreshPanel(interaction.guild, config);
    await interaction.reply({ content: `Cor **${name}** criada. ID: \`${id}\``, flags: MessageFlags.Ephemeral });
    return;
  }
  const found = getColor(config.categories, interaction.options.getString("cor", true));
  if (!found) {
    await interaction.reply({ content: "Cor não encontrada.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (sub === "editar") {
    const name = interaction.options.getString("nome", true).trim();
    const hex = parseColorValue(interaction.options.getString("valor", true));
    if (!hex) {
      await interaction.reply({ content: "Use #RRGGBB ou rgb(0,0,0).", flags: MessageFlags.Ephemeral });
      return;
    }
    found.color.name = name;
    found.color.hex = hex;
    const role = found.color.roleId ? await interaction.guild.roles.fetch(found.color.roleId) : null;
    if (role) await role.edit({ name: `FUNKAI • ${name}`, colors: { primaryColor: hexToNumber(hex) }, reason: `${BOT_NAME}: cor editada` });
    await saveData();
    await refreshPanel(interaction.guild, config);
    await interaction.reply({ content: `Cor atualizada para **${name}**.`, flags: MessageFlags.Ephemeral });
    return;
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`funkai_confirm_remove_color:${found.color.id}:${interaction.user.id}`).setLabel("Confirmar").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`funkai_cancel_remove_color:${found.color.id}:${interaction.user.id}`).setLabel("Cancelar").setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({ content: "Tem certeza que deseja remover esta cor?", components: [row], flags: MessageFlags.Ephemeral });
}

async function handleAddColors(interaction) {
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  const categoryId = interaction.options.getString("categoria", true);
  const category = config.categories.find((item) => item.id === categoryId);
  if (!category) {
    await interaction.reply({ content: "Categoria não encontrada.", flags: MessageFlags.Ephemeral });
    return;
  }

  let colors;
  try {
    colors = parseColorList(interaction.options.getString("lista", true));
  } catch (error) {
    await interaction.reply({ content: errorText(error), flags: MessageFlags.Ephemeral });
    return;
  }
  if (category.colors.length + colors.length > MAX_COLORS_PER_CATEGORY) {
    await interaction.reply({
      content: `Essa categoria aceita até ${MAX_COLORS_PER_CATEGORY} cores. Ela tem ${category.colors.length} e você tentou adicionar ${colors.length}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const existingIds = new Set(config.categories.flatMap((item) => item.colors.map((color) => color.id)));
  const batchIds = new Set();
  const duplicate = colors.find((color) => {
    const id = normalizeId(color.name);
    if (!id || existingIds.has(id) || batchIds.has(id)) return true;
    batchIds.add(id);
    return false;
  });
  if (duplicate) {
    await interaction.reply({ content: `A cor "${duplicate.name}" gera um ID repetido ou inválido.`, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const created = [];
  for (const color of colors) {
    const role = await interaction.guild.roles.create({
      name: `FUNKAI • ${color.name}`,
      colors: { primaryColor: hexToNumber(color.hex) },
      reason: `${BOT_NAME}: várias cores adicionadas`,
    });
    category.colors.push({ id: normalizeId(color.name), name: color.name, hex: color.hex, roleId: role.id });
    created.push(color);
  }
  await saveData();
  await refreshPanel(interaction.guild, config);
  await interaction.editReply({
    content: `Adicionei ${created.length} cor${created.length === 1 ? "" : "es"} na categoria **${category.name}** e criei os cargos correspondentes.`,
  });
}

async function handleButton(interaction) {
  const [action, itemId, userId] = interaction.customId.split(":");
  if (userId !== interaction.user.id) {
    await interaction.reply({ content: "Somente quem iniciou esta ação pode confirmá-la.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (action.startsWith("funkai_cancel_remove")) {
    await interaction.update({ content: "Remoção cancelada.", components: [] });
    return;
  }
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  if (action === "funkai_confirm_remove_color") {
    const found = getColor(config.categories, itemId);
    if (!found) {
      await interaction.update({ content: "Esta cor já foi removida.", components: [] });
      return;
    }
    const role = found.color.roleId ? await interaction.guild.roles.fetch(found.color.roleId).catch(() => null) : null;
    if (role && !role.deletable) {
      await interaction.update({
        content: "Não consegui remover o cargo dessa cor. Mova o cargo do bot para cima dos cargos FUNKAI e tente novamente.",
        components: [],
      });
      return;
    }
    if (role) await role.delete(`${BOT_NAME}: cor removida`);
    found.category.colors = found.category.colors.filter((color) => color.id !== itemId);
    await saveData();
    await refreshPanel(interaction.guild, config);
    await interaction.update({ content: `A cor **${found.color.name}** e o cargo correspondente foram removidos. O painel foi atualizado.`, components: [] });
    return;
  }
  const category = config.categories.find((item) => item.id === itemId);
  if (!category) {
    await interaction.update({ content: "Esta categoria já foi removida.", components: [] });
    return;
  }
  config.categories = config.categories.filter((item) => item.id !== itemId);
  await saveData();
  await refreshPanel(interaction.guild, config);
  await interaction.update({ content: `A categoria **${category.name}** foi removida. Os cargos foram mantidos.`, components: [] });
}

async function handleCategorySelect(interaction) {
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  const category = config.categories.find((item) => item.id === interaction.values[0]);
  if (!category) {
    await interaction.reply({ content: "Esta categoria não está mais disponível.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (!category.colors.length) {
    await interaction.reply({ content: "Esta categoria ainda não possui cores.", flags: MessageFlags.Ephemeral });
    return;
  }
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`funkai_color_select:${category.id}`)
    .setPlaceholder(`Escolha uma cor de ${category.name}`)
    .addOptions(category.colors.map((color) => ({ label: color.name.slice(0, 100), value: color.id, description: color.hex })));
  await interaction.reply({ content: `Cores em **${category.name}**`, components: [new ActionRowBuilder().addComponents(menu)], flags: MessageFlags.Ephemeral });
}

async function handleCategoryButton(interaction) {
  if (!interaction.guild) return;
  const [, categoryId] = interaction.customId.split(":");
  const config = getConfig(interaction.guild.id);
  const category = config.categories.find((item) => item.id === categoryId);
  if (!category) {
    await interaction.reply({ content: "Esta categoria não está mais disponível.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (!category.colors.length) {
    await interaction.reply({ content: "Esta categoria ainda não possui cores.", flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.reply({ ...(await colorPanelPayload(category)), flags: MessageFlags.Ephemeral });
}

async function handleColorPage(interaction) {
  if (!interaction.guild) return;
  const [, categoryId, pageText] = interaction.customId.split(":");
  const config = getConfig(interaction.guild.id);
  const category = config.categories.find((item) => item.id === categoryId);
  if (!category) {
    await interaction.update({ content: "Esta categoria não está mais disponível.", embeds: [], components: [] });
    return;
  }
  await interaction.update(await colorPanelPayload(category, pageText));
}

async function applyColorRole(interaction, found) {
  if (!interaction.guild) return;
  if (!found?.color.roleId) {
    return { content: "Esta cor ainda não possui um cargo sincronizado. Execute `/setup`." };
  }
  const member = await interaction.guild.members.fetch({ user: interaction.user.id, force: true });
  const targetRole = await interaction.guild.roles.fetch(found.color.roleId);
  if (!targetRole || !targetRole.editable) {
    return { content: "Não consigo aplicar essa cor porque meu cargo precisa ficar acima dos cargos de cores na hierarquia do servidor." };
  }
  const config = getConfig(interaction.guild.id);
  const roleIds = config.categories.flatMap((category) => category.colors.map((color) => color.roleId).filter(Boolean));
  const oldRoleIds = roleIds.filter((roleId) => roleId !== targetRole.id && member.roles.cache.has(roleId));
  const failedRoleIds = [];
  for (const roleId of oldRoleIds) {
    try {
      await member.roles.remove(roleId, `${BOT_NAME}: troca de cor`);
    } catch {
      failedRoleIds.push(roleId);
    }
  }
  if (failedRoleIds.length) {
    return { content: "Não consegui remover a cor anterior. Mova o cargo do bot para cima de todos os cargos FUNKAI e tente novamente." };
  }
  await member.roles.add(targetRole, `${BOT_NAME}: cor de perfil`);
  return { content: `Sua cor agora é **${found.color.name}**.` };
}

async function handleColorSelect(interaction) {
  if (!interaction.guild) return;
  const config = getConfig(interaction.guild.id);
  const result = await applyColorRole(interaction, getColor(config.categories, interaction.values[0]));
  await interaction.update({ content: result.content, components: [] });
}

async function handleColorButton(interaction) {
  if (!interaction.guild) return;
  const [, , colorId] = interaction.customId.split(":");
  const config = getConfig(interaction.guild.id);
  const result = await applyColorRole(interaction, getColor(config.categories, colorId));
  await interaction.update({ content: result.content, components: [] });
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "painel-menus") await handleSetup(interaction, "menus");
      else if (interaction.commandName === "painel-botoes") await handleSetup(interaction, "botoes");
      else if (interaction.commandName === "cores") {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === "adicionar") await handleAddColors(interaction);
        else if (subcommand.startsWith("categoria-")) await handleCategory(interaction);
        else await handleColor(interaction);
      }
    } else if (interaction.isButton()) {
      if (interaction.customId.startsWith("funkai_category_button:")) await handleCategoryButton(interaction);
      else if (interaction.customId.startsWith("funkai_color_page:")) await handleColorPage(interaction);
      else if (interaction.customId.startsWith("funkai_color_button:")) await handleColorButton(interaction);
      else await handleButton(interaction);
    } else if (interaction.isStringSelectMenu() && interaction.customId === "funkai_category_select") {
      await handleCategorySelect(interaction);
    } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith("funkai_color_select:")) {
      await handleColorSelect(interaction);
    }
  } catch (error) {
    console.error(`[interação] ${errorText(error)}`);
    if (interaction.isRepliable()) {
      if (interaction.deferred) await interaction.editReply({ content: `Não foi possível concluir a ação: ${errorText(error)}` });
      else if (!interaction.replied) await interaction.reply({ content: `Não foi possível concluir a ação: ${errorText(error)}`, flags: MessageFlags.Ephemeral });
    }
  }
});

client.once(Events.ClientReady, async (readyClient) => {
  const payload = commands.map((command) => command.toJSON());
  console.log(`${BOT_NAME} conectado como ${readyClient.user.tag}. Servidores encontrados: ${readyClient.guilds.cache.size}`);

  try {
    await readyClient.application.commands.set([]);
    console.log("[comandos] Comandos globais antigos removidos.");
  } catch (error) {
    console.error(`[comandos] Falha ao remover comandos globais: ${errorText(error)}`);
  }

  if (!readyClient.guilds.cache.size) {
    console.warn("[comandos] Nenhum servidor encontrado. Convide o bot usando os escopos bot e applications.commands.");
    return;
  }

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      await guild.commands.set(payload);
      console.log(`[comandos] Registrados no servidor: ${guild.name} (${guild.id})`);
      const config = guildsData[guild.id];
      if (config?.panelMode === "botoes" && config.panelImageMessageIds?.length) {
        await refreshPanel(guild, config);
        await saveData();
        console.log(`[painel] Imagens de cores atualizadas: ${config.panelImageMessageIds.length}`);
      }
    } catch (error) {
      console.error(`[comandos] Falha ao registrar em ${guild.name} (${guild.id}): ${errorText(error)}`);
    }
  }
});

client.on(Events.Error, (error) => console.error("[discord]", error));

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) throw new Error("DISCORD_BOT_TOKEN não foi configurado nas variáveis de ambiente do WispByte");
  await loadData();
  await client.login(token);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});