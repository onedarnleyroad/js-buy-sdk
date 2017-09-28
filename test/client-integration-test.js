import assert from 'assert';
import Client from '../src/client';
import fetchMock from './isomorphic-fetch-mock'; // eslint-disable-line import/no-unresolved

// fixtures
import shopWithProductsFixture from '../fixtures/shop-with-products-fixture';
import singleProductFixture from '../fixtures/product-fixture';
import multipleProductsFixture from '../fixtures/multiple-products-fixture';
import shopWithCollectionsFixture from '../fixtures/shop-with-collections-fixture';
import singleCollectionFixture from '../fixtures/collection-fixture';
import productWithPaginatedImagesFixture from '../fixtures/product-with-paginated-images-fixture';
import {secondPageImagesFixture, thirdPageImagesFixture, fourthPageImagesFixture, fifthPageImagesFixture} from '../fixtures/paginated-images-fixtures';
import productWithPaginatedVariantsFixture from '../fixtures/product-with-paginated-variants-fixture';
import {secondPageVariantsFixture, thirdPageVariantsFixture} from '../fixtures/paginated-variants-fixtures';
import productByHandleFixture from '../fixtures/product-by-handle-fixture';
import collectionByHandleFixture from '../fixtures/collection-by-handle-fixture';
import collectionWithProductsFixture from '../fixtures/collection-with-products-fixture';
import shopWithCollectionsWithPaginationFixture from '../fixtures/shop-with-collections-with-pagination-fixture';
import shopWithCollectionsWithProductsFixture from '../fixtures/shop-with-collections-with-products-fixture';
import shopInfoFixture from '../fixtures/shop-info-fixture';
import shopPoliciesFixture from '../fixtures/shop-policies-fixture';

suite('client-integration-test', () => {
  const domain = 'client-integration-tests.myshopify.io';
  const apiUrl = `https://${domain}/api/graphql`;
  const config = {
    storefrontAccessToken: 'abc123',
    domain
  };
  let client;

  setup(() => {
    client = Client.buildClient(config);
    fetchMock.reset();
  });

  teardown(() => {
    client = null;
    fetchMock.restore();
  });

  test('it resolves with an array of products on Client.product#fetchAllProducts', () => {
    fetchMock.postOnce(apiUrl, shopWithProductsFixture);

    return client.product.fetchAll().then((products) => {
      assert.ok(Array.isArray(products), 'products is an array');
      assert.equal(products.length, 2, 'there are two products');

      assert.equal(products[0].id, shopWithProductsFixture.data.shop.products.edges[0].node.id);
      assert.equal(products[1].id, shopWithProductsFixture.data.shop.products.edges[1].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with a single product on Client.product#fetch', () => {
    fetchMock.postOnce(apiUrl, singleProductFixture);

    const id = singleProductFixture.data.node.id;

    return client.product.fetch(id).then((product) => {
      assert.ok(!Array.isArray(product), 'product is not an array');
      assert.equal(product.id, id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with an array of products on Client.product#fetchMultiple', () => {
    fetchMock.postOnce(apiUrl, multipleProductsFixture);

    const id1 = multipleProductsFixture.data.nodes[0].id;
    const id2 = multipleProductsFixture.data.nodes[1].id;

    return client.product.fetchMultiple([id1, id2]).then((products) => {
      assert.ok(Array.isArray(products), 'products are an array');
      assert.equal(products[0].id, id1);
      assert.equal(products[1].id, id2);
      assert.ok(fetchMock.done());
    });
  });

  test('it fetches all images on products on Client.product#fetchAll', () => {
    fetchMock.postOnce(apiUrl, productWithPaginatedImagesFixture)
      .postOnce(apiUrl, secondPageImagesFixture)
      .postOnce(apiUrl, thirdPageImagesFixture);

    return client.product.fetchAll().then((products) => {
      const images = products[0].images;

      assert.ok(Array.isArray(images), 'images is an array');
      // Each image page fixture only contains 1 image rather than 20 for simplicity
      assert.equal(images.length, 3, 'all three pages of images are returned');
      assert.equal(images[0].id, productWithPaginatedImagesFixture.data.shop.products.edges[0].node.images.edges[0].node.id);
      assert.equal(images[1].id, secondPageImagesFixture.data.node.images.edges[0].node.id);
      assert.equal(images[2].id, thirdPageImagesFixture.data.node.images.edges[0].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it fetches all variants on Client.product#fetch', () => {
    fetchMock.postOnce(apiUrl, productWithPaginatedVariantsFixture)
      .postOnce(apiUrl, secondPageVariantsFixture)
      .postOnce(apiUrl, thirdPageVariantsFixture);

    return client.product.fetch(productWithPaginatedVariantsFixture.data.node.id).then((product) => {
      const variants = product.variants;

      assert.ok(Array.isArray(variants), 'variants is an array');
      // Each variant page fixture only contains 1 variant rather than 20 for simplicity
      assert.equal(variants.length, 3, 'all three pages of variants are returned');
      assert.equal(variants[0].id, productWithPaginatedVariantsFixture.data.node.variants.edges[0].node.id);
      assert.equal(variants[1].id, secondPageVariantsFixture.data.node.variants.edges[0].node.id);
      assert.equal(variants[2].id, thirdPageVariantsFixture.data.node.variants.edges[0].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it does not fetch paginated images if the images query result was empty on Client.product#fetch', () => {
    fetchMock.postOnce(apiUrl, {
      data: {
        node: {
          images: {
            edges: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      }
    });

    return client.product.fetch('an-id').then((product) => {
      assert.equal(product.images.length, 0);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch a product by handle through Client.product#fetchByHandle', () => {
    fetchMock.postOnce(apiUrl, productByHandleFixture);

    const handle = productByHandleFixture.data.shop.productByHandle.handle;

    return client.product.fetchByHandle(handle).then((product) => {
      assert.equal(product.id, productByHandleFixture.data.shop.productByHandle.id);
      assert.equal(product.handle, handle);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves products with Client.product#fetchQuery', () => {
    fetchMock.postOnce(apiUrl, shopWithProductsFixture);

    return client.product.fetchQuery({}).then((products) => {
      assert.equal(products.length, 2);
      assert.equal(products[0].id, shopWithProductsFixture.data.shop.products.edges[0].node.id);
      assert.equal(products[1].id, shopWithProductsFixture.data.shop.products.edges[1].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with an array of collections on Client.collection#fetchAll', () => {
    fetchMock.postOnce(apiUrl, shopWithCollectionsFixture);

    return client.collection.fetchAll().then((collections) => {
      assert.ok(Array.isArray(collections), 'collections is an array');
      assert.equal(collections.length, 2, 'there are two collections');

      assert.equal(collections[0].id, shopWithCollectionsFixture.data.shop.collections.edges[0].node.id);
      assert.equal(collections[1].id, shopWithCollectionsFixture.data.shop.collections.edges[1].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with a single collection on Client.collection#fetch', () => {
    fetchMock.postOnce(apiUrl, singleCollectionFixture);

    const id = singleCollectionFixture.data.node.id;

    return client.collection.fetch(id).then((collection) => {
      assert.ok(Array.isArray(collection) === false, 'collection is not an array');
      assert.equal(collection.id, id);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch a collection by handle through Client.collection#fetchByHandle', () => {
    fetchMock.postOnce(apiUrl, collectionByHandleFixture);

    const handle = collectionByHandleFixture.data.shop.collectionByHandle.handle;

    return client.collection.fetchByHandle(handle).then((collection) => {
      assert.equal(collection.id, collectionByHandleFixture.data.shop.collectionByHandle.id);
      assert.equal(collection.handle, handle);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch collections with the query arg on Client.collection#fetchQuery', () => {
    fetchMock.postOnce(apiUrl, shopWithCollectionsFixture);

    return client.collection.fetchQuery({}).then((collections) => {
      assert.equal(collections.length, 2);
      assert.equal(collections[0].id, shopWithCollectionsFixture.data.shop.collections.edges[0].node.id);
      assert.equal(collections[1].id, shopWithCollectionsFixture.data.shop.collections.edges[1].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch all collections with products on Client.collection#fetchAllWithProducts', () => {
    fetchMock.postOnce(apiUrl, shopWithCollectionsWithProductsFixture);

    return client.collection.fetchAllWithProducts().then((collections) => {
      assert.ok(Array.isArray(collections), 'collections is an array');
      assert.equal(collections.length, 2, 'there are two collections');
      assert.equal(collections[0].id, shopWithCollectionsWithProductsFixture.data.shop.collections.edges[0].node.id);
      assert.equal(collections[1].id, shopWithCollectionsWithProductsFixture.data.shop.collections.edges[1].node.id);
      assert.ok(fetchMock.done());
    });
  });

  test('it can fetch a single collection with products on Client.collection#fetchWithProducts', () => {
    fetchMock.postOnce(apiUrl, collectionWithProductsFixture);

    const id = collectionWithProductsFixture.data.node.id;

    return client.collection.fetchWithProducts(id).then((collection) => {
      assert.equal(Array.isArray(collection), false, 'collection is not an array');
      assert.equal(collection.id, id);
      assert.equal(collection.products.length, 2);
      assert.ok(fetchMock.done());
    });
  });

  test('it paginates on images on products within collections on Client.collection#fetchAllWithProducts', () => {
    fetchMock.postOnce(apiUrl, shopWithCollectionsWithPaginationFixture)
      .postOnce(apiUrl, thirdPageImagesFixture)
      .postOnce(apiUrl, fourthPageImagesFixture)
      .postOnce(apiUrl, fifthPageImagesFixture);

    return client.collection.fetchAllWithProducts().then((collections) => {
      assert.equal(collections.length, 2);
      // Verify that all images are added
      assert.equal(collections[0].products[0].images.length, 2);
      assert.equal(collections[0].products[1].images.length, 2);
      assert.equal(collections[1].products[0].images.length, 2);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with `shop` on Client.shop#fetchInfo', () => {
    fetchMock.postOnce(apiUrl, shopInfoFixture);

    return client.shop.fetchInfo().then((shop) => {
      assert.equal(shop.name, shopInfoFixture.data.shop.name);
      assert.equal(shop.description, shopInfoFixture.data.shop.description);
      assert.ok(fetchMock.done());
    });
  });

  test('it resolves with `shop` on Client.shop#fetchPolicies', () => {
    fetchMock.postOnce(apiUrl, shopPoliciesFixture);

    return client.shop.fetchPolicies().then((shop) => {
      assert.equal(shop.privacyPolicy.id, shopPoliciesFixture.data.shop.privacyPolicy.id);
      assert.equal(shop.termsOfService.id, shopPoliciesFixture.data.shop.termsOfService.id);
      assert.equal(shop.refundPolicy.id, shopPoliciesFixture.data.shop.refundPolicy.id);
      assert.ok(fetchMock.done());
    });
  });
});
