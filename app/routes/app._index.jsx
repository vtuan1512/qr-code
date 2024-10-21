import { json } from "@remix-run/node";
import { useLoaderData, Link, useNavigate, useSearchParams } from "@remix-run/react";
import {
  Card,
  EmptyState,
  Layout,
  Page,
  IndexTable,
  Thumbnail,
  Text,
  Icon,
  InlineStack,
  Pagination,
} from "@shopify/polaris";
import SearchBar from "../components/SearchBarComponent.jsx"
import { authenticate } from "../shopify.server";
import { getQRCodes } from "../models/QRCode.server";
import { AlertDiamondIcon, ImageIcon } from "@shopify/polaris-icons";

const ITEMS_PER_PAGE = 10;

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const search = url.searchParams.get("search") || "";
  const qrCodes = await getQRCodes(session.shop, admin.graphql);

  const filteredQRCodes = qrCodes.filter((qrCode) =>
    qrCode.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = filteredQRCodes.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedQRCodes = filteredQRCodes.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return json({
    qrCodes: paginatedQRCodes,
    currentPage: page,
    totalPages,
  });
}
const EmptyQRCodeState = ({ onAction }) => (
  <EmptyState
    heading="Create unique QR codes for your product"
    action={{
      content: "Create QR code",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>Allow customers to scan codes and buy products using their phones.</p>
  </EmptyState>
);

function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

const QRTable = ({ qrCodes }) => (
  <IndexTable
    resourceName={{ singular: "QR code", plural: "QR codes" }}
    itemCount={qrCodes.length}
    headings={[
      { title: "Thumbnail", hidden: true },
      { title: "Title" },
      { title: "Product" },
      { title: "Date created" },
      { title: "Scans" },
    ]}
    selectable={false}
  >
    {qrCodes.map((qrCode) => (
      <QRTableRow key={qrCode.id} qrCode={qrCode} />
    ))}
  </IndexTable>
);

const QRTableRow = ({ qrCode }) => (
  <IndexTable.Row id={qrCode.id} position={qrCode.id}>
    <IndexTable.Cell>
      <Thumbnail
        source={qrCode.productImage || ImageIcon}
        alt={qrCode.productTitle}
        size="small"
      />
    </IndexTable.Cell>
    <IndexTable.Cell>
      <Link to={`qrcodes/${qrCode.id}`}>{truncate(qrCode.title)}</Link>
    </IndexTable.Cell>
    <IndexTable.Cell>
      {qrCode.productDeleted ? (
        <InlineStack align="start" gap="200">
          <span style={{ width: "20px" }}>
            <Icon source={AlertDiamondIcon} tone="critical" />
          </span>
          <Text tone="critical" as="span">
            Product has been deleted
          </Text>
        </InlineStack>
      ) : (
        truncate(qrCode.productTitle)
      )}
    </IndexTable.Cell>
    <IndexTable.Cell>{new Date(qrCode.createdAt).toDateString()}</IndexTable.Cell>
    <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
  </IndexTable.Row>
);

export default function Index() {
  const { qrCodes, currentPage, totalPages } = useLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const goToPage = (page) => {
    searchParams.set("page", page);
    navigate(`?${searchParams.toString()}`);
  };

  return (
    <Page>
      <ui-title-bar title="QR codes">
        <button variant="primary" onClick={() => navigate("/app/qrcodes/new")}>
          Create QR code
        </button>
      </ui-title-bar>
      <SearchBar initialSearch={searchParams.get("search")} />
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {qrCodes.length === 0 ? (
              <EmptyQRCodeState onAction={() => navigate("qrcodes/new")} />
            ) : (
              <>
                <QRTable qrCodes={qrCodes} />
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "10px" }}>
                  <Text variant="bodySm">
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Pagination
                    hasPrevious={currentPage > 1}
                    onPrevious={() => goToPage(currentPage - 1)}
                    hasNext={currentPage < totalPages}
                    onNext={() => goToPage(currentPage + 1)}
                  />
                </div>
              </>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
