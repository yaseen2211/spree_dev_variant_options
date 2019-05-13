//= require spree/frontend
//= require extentions/array
//= require extentions/global_methods

var SpreeVariantOption = {};
SpreeVariantOption.OptionValuesHandler = function(selectors) {
  this.optionsButton = selectors.optionsButton;
  this.addToCartButton = selectors.addToCartButton;
  this.priceHeading = selectors.priceHeading;
  this.quantityField = selectors.quantityField;
  this.variantField = selectors.variantField;
  this.thumbImages = selectors.thumbImages;
  this.variantId = 0;
  this.variantPrice = 0;
};

SpreeVariantOption.OptionValuesHandler.prototype.init = function() {
  this.disableCartInputFields(true);
  this.originalCombination = original_combination;
  this.possibleCombinationsArray = $.extend(true, [], this.originalCombination);
  console.log({init:this.possibleCombinationsArray});
  this.baseTabHash = {initial:this.possibleCombinationsArray, after:[]}
  this.tabHash = {}
  this.onButtonClick();
};

SpreeVariantOption.OptionValuesHandler.prototype.updateOtherAvailability = function(otherOptions,level) {
  /*
   * disable all first
   */
  let allOptions = this.originalCombination.map(el=>Object.keys(el)).flat();
  let setAllOptions = new Set(allOptions);

  setAllOptions.forEach(typeId=>{
    if(parseInt(typeId) > 1){
      let optionTypeValues = $(`[data-hook='option-value'][data-type-id=${typeId}]`);
      $.each(optionTypeValues,(index,el)=>{
        if($(el).data('level')>level){//only disable on upcoming tabs
          if($(el).is('input')){
            $(el).attr('disabled',true);
          }else{
            optionTypeValues.addClass('disabled');
            optionTypeValues.html('X');
          }
        }

      })
    }
  });

  /*
   * enable what should be open
   */
  otherOptions.forEach((el)=>{
    Object.keys(el).forEach((k)=>{
      let optionValuesFound = $(`[data-hook='option-value'][data-type-id=${k}][data-value-id=${el[k]}]`);

      $.each(optionValuesFound,(index,el)=>{
        if($(el).data('level')>level) {//only disable on upcoming tabs
          if ($(el).is('input')) {
            $(el).attr('disabled', false);
          } else {
            optionValuesFound.removeClass('disabled');
            optionValuesFound.html('');
          }
        }
      })
    })
  })
};

SpreeVariantOption.OptionValuesHandler.prototype.updateTabs = function(){

};


SpreeVariantOption.OptionValuesHandler.prototype.getTabSelectedValue = function(tabNo){
  let keyValue={};
  this.optionsButton.filter('.selected').each(function() {
    if($(this).data('level') === tabNo) {
      keyValue = {key:$(this).data('type-id'),value:$(this).data('value-id')}
    }
  });
  return keyValue;
}

SpreeVariantOption.OptionValuesHandler.prototype.manageTabs = function(level,clickedOptionValue){
  var _this = this;
  let keyValue ;

  if(parseInt(level)===1 || !this.tabHash){
    keyValue = this.getTabSelectedValue(1);
    reducedArray = _this.findAndReduce(_this.possibleCombinationsArray, null, keyValue);

    this.tabHash = {
      initial:[..._this.possibleCombinationsArray],
      after:reducedArray,
    }
  }else{
    let iteratedLevel = 1;
    reducedArray = this.tabHash.initial;
    while (iteratedLevel <= level) {
      keyValue = this.getTabSelectedValue(iteratedLevel);
      reducedArray = _this.findAndReduce(reducedArray, null,keyValue);
      iteratedLevel++;
    }
  }

  console.log({reducedArray});
  _this.updateOtherAvailability(reducedArray,level);

  // $('.variant-options').on('click',function(e){
  //   var $this = $(this);
  //   let level = $this.data('step');
  //   let reducedArray = [];
  //   debugger
  //   if(parseInt(level)===0 || !tabHash){
  //     reducedArray = _this.findAndReduce(_this.possibleCombinationsArray, $this);
  //     tabHash = {
  //       initial:[..._this.possibleCombinationsArray],
  //       after:reducedArray
  //     }
  //   }else{
  //     let iteratedLevel = 0;
  //     reducedArray = tabHash.initial;
  //     while (iteratedLevel < level) {
  //       reducedArray = _this.findAndReduce(reducedArray, $this);
  //       iteratedLevel++;
  //     }
  //   }
  //
  //   _this.updateOtherAvailability(reducedArray);
  // })
}

SpreeVariantOption.OptionValuesHandler.prototype.onButtonClick = function() {
  var _this = this;

  this.optionsButton.on("click", function() {
    var $this = $(this);
    $this.closest('.js-tab-content').find('.option-value').removeClass('selected');
    $this.addClass("selected");
    _this.disableCartInputFields(true);
    //alert($this.data('level'));
    _this.manageTabs($this.data('level'),$this);
    _this.setVariantSelected();
    // if(_this.possibleCombinationsArray.length === 0){
    //   _this.noVariantsPresent($this);
    // } else if(_this.containsEmptyHash()) {
    //   _this.setVariantSelected();
    // } else if (_this.possibleCombinationsArray.length === 1) {
    //   _this.findOptionButton(_this.possibleCombinationsArray[0]).trigger('click');
    // }
  });
};

SpreeVariantOption.OptionValuesHandler.prototype.noVariantsPresent = function(optionClicked) {
  this.resetAllOtherButtons(optionClicked);
  this.possibleCombinationsArray = $.extend(true, [], this.originalCombination);
  optionClicked.trigger('click');
};

SpreeVariantOption.OptionValuesHandler.prototype.setVariantSelected = function() {
  this.disableCartInputFields(false);
  var variant = this.findVariantForAllSelected();
  console.log({variant});
  if(!!variant){
    this.setVariantId(variant);
    this.showVariantImages(variant.variant_id);
  }

};

SpreeVariantOption.OptionValuesHandler.prototype.resetAllOtherButtons = function(justClicked){
  this.variantField.val('');
  this.thumbImages.show();
  this.optionsButton.filter('.selected').not(justClicked).removeClass('out-of-stock').removeClass('selected');
};

SpreeVariantOption.OptionValuesHandler.prototype.findVariantForAllSelected = function(){
  let conditions = {};
  let variant = null;

  this.optionsButton.filter('.selected').each(function() {
    conditions[$(this).data('typeId')] = $(this).data('valueId');
  });
  $.each(variant_option_details, function() {
    if (objectContains(this.option_types, conditions)) {
      variant = this;
    }
  });
  return variant;
};

SpreeVariantOption.OptionValuesHandler.prototype.findOptionButton = function(hash) {
  var key = Object.keys(hash)[0],
      value = hash[key];
  return this.optionsButton.filter('[data-type-id="' + key + '"][data-value-id="' + value + '"]');
};

SpreeVariantOption.OptionValuesHandler.prototype.setVariantId = function(variant) {
  this.variantField.val(variant.variant_id);
  this.variantField.trigger('change');
  this.priceHeading.html(variant.variant_price);
  if (!variant.in_stock && !options.allow_select_outofstock) {
    this.optionsButton.filter('.selected').addClass('out-of-stock');
  }
};

SpreeVariantOption.OptionValuesHandler.prototype.containsEmptyHash = function() {
  for (var i = this.possibleCombinationsArray.length - 1; i >= 0; i--) {
    if(Object.keys(this.possibleCombinationsArray[i]).length === 0){
      return true;
    }
  }
};

SpreeVariantOption.OptionValuesHandler.prototype.findAndReduce = function(availableOptions, justClickedButton, existingPair) {
  let options = $.extend(true, [], availableOptions);
  let key,value;

  if(existingPair){
    key = existingPair.key;
    value = existingPair.value;
  }else{
    key = justClickedButton.data("type-id")
    value = justClickedButton.data("value-id");
  }

  return options.filter(function (item) {
    if (item[key] === value) {
      delete item[key];
      return item;
    }
  });
};

SpreeVariantOption.OptionValuesHandler.prototype.disableCartInputFields = function(value) {
  this.addToCartButton.prop('disabled', value);
  this.quantityField.prop('disabled', value);
  if(value) {
    this.priceHeading.html('Select Variant');
  }
};

SpreeVariantOption.OptionValuesHandler.prototype.showVariantImages = function(variantId) {
  var imagesToShow = this.thumbImages.filter('li.tmb-' + variantId);
  this.thumbImages.hide();
  if (imagesToShow.length === 0 ) {
    allVariantImage = $('li.tmb-all')
    if (allVariantImage.length === 0) {
      $('li.noimage').first().trigger('mouseenter');
    } else {
      allVariantImage.first().trigger('mouseenter');
    }
  } else {
    imagesToShow.show().first().trigger('mouseenter');
  }
};

$(function() {
  if ($("input#variant_present").val() == 'true') {
    (new SpreeVariantOption.OptionValuesHandler({
      optionsButton: $('[data-hook=option-value]'),
      addToCartButton: $('#add-to-cart-button'),
      priceHeading: $('#product-price [itemprop=price]'),
      quantityField: $('#quantity'),
      variantField: $('input#variant_id'),
      thumbImages: $('li.vtmb')
    })).init();
  }
});
