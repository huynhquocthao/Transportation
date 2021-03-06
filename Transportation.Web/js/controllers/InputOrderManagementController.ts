/// <reference path="../../lib/angular/angular.d.ts" />
/// <reference path="../../lib/angular/angular-cookies.d.ts" />
/// <reference path="IController.ts" />
/// <reference path="../services/AuthenticationService.ts" />

declare var VERSION_NUMBER;

module Clarity.Controller {
	import service = Clarity.Service;
	import helper = Clarity.Helper;

  export class InputOrderManagementController {
    public currentInputOrder: Model.InputOrderModel;
    public inputOrderService: service.InputOrderService;
    public productService: service.ProductService;
    public mainHelper: helper.MainHelper;

    public inputOrderList: Array<Model.InputOrderModel>;
    public productList: Array<Model.ProductModel>;

    public inputOrderListTmp: Array<Model.InputOrderModel>;
    public numOfPages: number;
    public currentPage: number;
    public pageSize: number;
    public isCheckedAll: boolean;
    public isLoading: boolean;
    public todayFormat: string;

    constructor(private $scope,
      private $rootScope: IRootScope,
      private $http: ng.IHttpService,
      private $location: ng.ILocationService,
      private $window: ng.IWindowService,
      private $filter: ng.IFilterService,
      private $cookieStore: ng.ICookieStoreService,
      private $routeParams: any) {

      this.mainHelper = new helper.MainHelper($http, $cookieStore);
      this.inputOrderService = new service.InputOrderService($http);
      this.productService = new service.ProductService($http);
      $scope.viewModel = this;

      this.pageSize = 10;
      this.initInputOrder();

      var self = this;
      $scope.$watch('searchText', function (value) {
        if (self.inputOrderListTmp && self.inputOrderListTmp.length > 0) {
          self.inputOrderList = $filter('filter')(self.inputOrderListTmp, value);
          self.initPagination();
        }
      });
    }

    initInputOrder() {
      var inputOrderId = this.$routeParams.input_order_id;
      if (inputOrderId) {
        if (this.$location.path() === '/ql-garage/nhap-kho/' + inputOrderId) {
          this.inputOrderService.getById(inputOrderId, (data) => {
            this.currentInputOrder = data;
            this.initProductList();
          }, null);
        } else if (this.$location.path() === '/ql-garage/nhap-kho/sua/' + inputOrderId) {
          if (this.currentInputOrder == null) {
            this.inputOrderService.getById(inputOrderId, (data) => {
              this.currentInputOrder = data;
              this.initFormatPriceForProductInputs(this.currentInputOrder);
              this.initProductList();
            }, null);
          }
        }
      } else {
        if (this.$location.path() === '/ql-garage/nhap-kho/tao') {
          this.initProductList();
          this.todayFormat = new Date().toLocaleString();
          this.currentInputOrder = new Model.InputOrderModel();
          this.currentInputOrder.totalAmount = 0;
        } else if (this.$location.path() === '/ql-garage/nhap-kho') {
          this.isLoading = true;
          this.initInputOrderList();
        }
      }
    }

    initInputOrderList() {
      this.inputOrderService.getAll((results: Array<Model.InputOrderModel>) => {
        this.inputOrderList = results;
        this.inputOrderList.sort(function (a: any, b: any) {
          return a.id - b.id;
        });
        this.inputOrderListTmp = this.inputOrderList;
        this.initPagination();
        this.isLoading = false;
      }, null);
    }

    initProductList() {
      this.productService.getAll((results: Array<Model.ProductModel>) => {
        this.productList = results;
      }, null);
    }

    initFormatPriceForProductInputs(inputOrder: Model.InputOrderModel) {
      if (inputOrder && inputOrder.productInputs && inputOrder.productInputs.length > 0) {
        for (var productInput of inputOrder.productInputs) {
          productInput.inputPriceFormated = productInput.inputPrice != 0 ? productInput.inputPrice.toLocaleString() : '';
          productInput.salePriceFormated = productInput.salePrice != 0 ? productInput.salePrice.toLocaleString() : '';
        }
      }
    }

    initPagination() {
      this.currentPage = 1;
      this.numOfPages = this.inputOrderList.length % this.pageSize === 0 ?
        this.inputOrderList.length / this.pageSize : Math.floor(this.inputOrderList.length / this.pageSize) + 1;
    }

    getInputOrderListOnPage() {
      if (this.inputOrderList && this.inputOrderList.length > 0) {
        var startIndex = this.pageSize * (this.currentPage - 1);
        var endIndex = startIndex + this.pageSize;
        return this.inputOrderList.slice(startIndex, endIndex);
      }
    }

    getNumberPage() {
      if (this.numOfPages > 0) {
        return new Array(this.numOfPages);
      }
      return new Array(0);
    }

    goToPage(pageIndex: number) {
      this.currentPage = pageIndex;
    }

    goToPreviousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.goToPage(this.currentPage);
      }
    }
    goToNextPage() {
      if (this.currentPage < this.numOfPages) {
        this.currentPage++;
        this.goToPage(this.currentPage);
      }
    }

    selectAllInputOrdersOnPage() {
      var inpuOrderOnPage = this.getInputOrderListOnPage();
      for (let index = 0; index < inpuOrderOnPage.length; index++) {
        var inputOrder = inpuOrderOnPage[index];
        inputOrder.isChecked = this.isCheckedAll;
      }
    }

    removeOrders() {
      var confirmDialog = this.$window.confirm('Bạn có muốn xóa kho hàng?');
      if (confirmDialog) {
        for (let i = 0; i < this.inputOrderList.length; i++) {
          var product = this.inputOrderList[i];
          if (product.isChecked) {
            this.inputOrderService.deleteEntity(product, (data) => {
              this.initInputOrderList();
            }, () => { });
          }
        }
      }
    }

    removeInputOrderInDetail(inputOrder: Model.InputOrderModel) {
      var confirmDialog = this.$window.confirm('Bạn có muốn xóa kho hàng?');
      if (confirmDialog) {
        this.inputOrderService.deleteEntity(inputOrder, (data) => {
          this.$location.path('/ql-garage/nhap-kho');
        }, null);
      }
    }

    createInputOrder(inputOrder: Model.InputOrderModel) {
      this.inputOrderService.create(inputOrder,
        (data) => {
          this.$location.path('/ql-garage/nhap-kho');
        }, null);
    }

    updateInputOrder(inputOrder: Model.InputOrderModel) {
      this.inputOrderService.update(inputOrder, (data) => {
        this.$location.path('/ql-garage/nhap-kho');
      }, null);
    }

    goToInputOrderForm() {
      this.$location.path('/ql-garage/nhap-kho/tao');
    }

    addProductInput() {
      var productInput = new Model.ProductInputModel();
      this.currentInputOrder.productInputs.push(productInput);
    }

    deleteProductInput(index: number) {
      this.currentInputOrder.productInputs.splice(index, 1);
      this.updateTotalAmount();
    }

    getProductById(id: number) {
      if (this.productList && this.productList.length > 0) {
        for (let product of this.productList) {
          if (product.id == id) {
            return product;
          }
        }
      }
      return null;
    }

    updateTotalAmount() {
      this.currentInputOrder.totalAmount = 0;
      if (this.currentInputOrder && this.currentInputOrder.productInputs && this.currentInputOrder.productInputs.length) {
        for (var productInput of this.currentInputOrder.productInputs) {
          this.currentInputOrder.totalAmount += productInput.inputPrice * productInput.quantity;
        }
      }
    }

    setFormatedCurencyForProductInput(productInput: Model.ProductInputModel, type: number) {
      if (type == 0) {
        if (productInput.inputPriceFormated && productInput.inputPriceFormated != '') {
          productInput.inputPrice = parseInt(productInput.inputPriceFormated.replace(/,/g, ''));
          productInput.inputPriceFormated = productInput.inputPrice.toLocaleString();
        }
        this.updateTotalAmount();
      } else if (type == 1) {
        productInput.salePrice = parseInt(productInput.salePriceFormated.replace(/,/g, ''));
        productInput.salePriceFormated = productInput.salePrice.toLocaleString();
      }
    }

	}
}