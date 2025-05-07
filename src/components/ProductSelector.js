import React from 'react';
import Select from 'react-select';

const ProductSelector = ({ products = [], value, onChange }) => {
  const options = products.map(product => ({
    value: product.product_name,
    label: product.product_name
  }));

  const selectedOption = options.find(option => option.value === value) || null;

  const customStyles = {
    control: (provided) => ({
      ...provided,
      fontFamily: "'MS Sans Serif', Arial, sans-serif",
      fontSize: '12px',
      backgroundColor: '#fff',
      border: '1px solid #999',
      borderRadius: '2px',
      padding: '4px',
      height: '28px', // Matches input height (4px padding + 1px border + content)
      minHeight: '28px',
      boxSizing: 'border-box',
      width: '100%',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#00A550'
      },
      display: 'flex',
      alignItems: 'center'
    }),
    input: (provided) => ({
      ...provided,
      color: '#333',
      margin: 0,
      padding: 0
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#666'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#333',
      lineHeight: 'normal'
    }),
    menu: (provided) => ({
      ...provided,
      fontFamily: "'MS Sans Serif', Arial, sans-serif",
      fontSize: '12px',
      backgroundColor: '#fff',
      border: '1px solid #999',
      borderRadius: '2px',
      zIndex: 9999,
      width: '100%'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#00A550' : state.isFocused ? '#f5f5f5' : '#fff',
      color: state.isSelected ? '#fff' : '#333',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      }
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: '0 4px',
      color: '#333'
    }),
    clearIndicator: (provided) => ({
      ...provided,
      padding: '0 4px',
      color: '#333'
    })
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : '')}
      placeholder="Select a product..."
      isClearable
      isSearchable
      menuPortalTarget={document.body}
      styles={customStyles}
    />
  );
};

export default ProductSelector;