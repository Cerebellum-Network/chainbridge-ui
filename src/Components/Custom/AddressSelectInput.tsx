import React from "react";
import {SelectInput} from "@chainsafe/common-components";
import {useField} from "formik";
import {DestinationChainContext} from "../../Contexts/Adaptors/interfaces";

interface IAddressSelectInput {
    addresses: DestinationChainContext["addresses"];
    name: string;
};

const AddressSelectInput: React.FC<IAddressSelectInput> =
    ({
         addresses,
         name,
     }) => {
        const [field, meta, helpers] = useField(name);

        return (
            <SelectInput
                value={field.value}
                label="Select a destination account"
                options={addresses}
                onChange={(address) => {
                    helpers.setValue(address);
                }}
                placeholder="Select a destination account"
            />
        );
    };

export default AddressSelectInput;
